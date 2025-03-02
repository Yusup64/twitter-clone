/**
 * 尝试获取本机IP地址
 * 注意：这个函数只能在浏览器环境中使用
 */
export const getLocalIpAddress = async (): Promise<string | null> => {
  try {
    // 使用WebRTC获取本地IP地址
    const pc = new RTCPeerConnection({ iceServers: [] });

    pc.createDataChannel('');

    const offer = await pc.createOffer();

    await pc.setLocalDescription(offer);

    return new Promise<string | null>((resolve) => {
      // 设置超时，防止长时间等待
      const timeout = setTimeout(() => {
        pc.close();
        resolve(null);
      }, 5000);

      pc.onicecandidate = (ice) => {
        if (ice.candidate) {
          const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
          const match = ipRegex.exec(ice.candidate.candidate);

          if (match && match[1] && !match[1].startsWith('127.')) {
            clearTimeout(timeout);
            pc.close();
            resolve(match[1]);
          }
        }
      };

      // 如果没有找到候选项，返回null
      setTimeout(() => {
        pc.close();
        resolve(null);
      }, 1000);
    });
  } catch (error) {
    console.error('获取本地IP地址失败:', error);

    return null;
  }
};

/**
 * 检查WebSocket URL是否可访问
 */
export const checkWebSocketUrl = async (url: string): Promise<boolean> => {
  try {
    // 尝试通过HTTP请求检查服务器是否可访问
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    });

    return true;
  } catch (error) {
    console.error('检查WebSocket URL失败:', error);

    return false;
  }
};

/**
 * 获取可能的WebSocket URL列表
 */
export const getPossibleWebSocketUrls = async (
  port: number = 8080,
): Promise<string[]> => {
  const urls: string[] = [
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
  ];

  // 尝试获取本机IP地址
  const localIp = await getLocalIpAddress();

  if (localIp) {
    urls.push(`http://${localIp}:${port}`);
  }

  return urls;
};
