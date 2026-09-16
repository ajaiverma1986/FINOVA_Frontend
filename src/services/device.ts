export async function deviceRequest(action: 'connect' | 'info' | 'capture', signal?: AbortSignal) {
  const endpoint = {
    connect: ['', 'RDSERVICE'],
    info: ['/getDeviceInfo', 'DEVICEINFO'],
    capture: ['/capture', 'CAPTURE'],
  }[action];
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 20_000);
  try {
    const response = await fetch('https://localhost:11100' + endpoint[0], {
      method: endpoint[1],
      signal: controller.signal,
      headers: {
        Accept: 'text/xml',
        ...(action === 'capture' ? { 'Content-Type': 'text/xml' } : {}),
      },
      body:
        action === 'capture'
          ? '<PidOptions ver="1.0"><Opts fCount="1" fType="2" iCount="0" pCount="0" format="0" pidVer="2.0" timeout="10000" otp="" wadh="" posh=""/></PidOptions>'
          : undefined,
    });
    if (!response.ok) throw new Error('Device request failed.');
    const text = await response.text();
    const xml = new DOMParser().parseFromString(text, 'text/xml');
    if (xml.querySelector('parsererror')) throw new Error('The device returned invalid data.');
    const error = xml.querySelector('Resp');
    if (error && error.getAttribute('errCode') !== '0')
      throw new Error(error.getAttribute('errInfo') || 'Capture failed.');
    if (action === 'capture') return { Status: 'Fingerprint captured successfully' };
    const info = xml.querySelector(action === 'connect' ? 'RDService' : 'DeviceInfo');
    return info
      ? Object.fromEntries(
          [...info.attributes].map((attribute) => [attribute.name, attribute.value]),
        )
      : { Status: 'Device responded' };
  } catch (error) {
    if (error instanceof Error && !['TypeError', 'AbortError'].includes(error.name)) throw error;
    throw new Error(
      'Unable to reach the Morpho device. Check that the RD service is running and its local certificate is trusted.',
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
