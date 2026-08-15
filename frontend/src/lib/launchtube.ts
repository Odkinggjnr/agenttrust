interface LaunchtubeConfig {
  url: string;
  jwt: string;
  initialized: boolean;
}

let launchtubeConfig: LaunchtubeConfig | null = null;

export function initLaunchtube(): LaunchtubeConfig {
  const url = process.env.NEXT_PUBLIC_LAUNCHTUBE_URL || "https://launchtube.xyz";
  const jwt = process.env.NEXT_PUBLIC_LAUNCHTUBE_JWT || "";

  if (!jwt) {
    console.warn("Launchtube JWT not configured. Fee-abstracted submissions will fail.");
  }

  launchtubeConfig = {
    url,
    jwt,
    initialized: true,
  };

  console.log("Launchtube initialized with URL:", url);
  return launchtubeConfig;
}

export async function submitTransaction(signedXdr: string): Promise<string> {
  if (!launchtubeConfig?.initialized) {
    initLaunchtube();
  }

  if (!launchtubeConfig?.jwt) {
    throw new Error("Launchtube JWT not configured. Cannot submit transaction.");
  }

  console.log("Submitting transaction via Launchtube");

  // In production, this would:
  // 1. POST the signed XDR to the Launchtube API
  // 2. Launchtube wraps it with a fee-paying account
  // 3. Submits to the Stellar network
  // 4. Returns the transaction hash
  //
  // const response = await fetch(`${launchtubeConfig.url}/api/submit`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     "Authorization": `Bearer ${launchtubeConfig.jwt}`,
  //   },
  //   body: JSON.stringify({ xdr: signedXdr }),
  // });
  // const result = await response.json();
  // return result.hash;

  // Mock: generate a fake transaction hash
  const hashChars = "abcdef0123456789";
  let hash = "";
  for (let i = 0; i < 64; i++) {
    hash += hashChars[Math.floor(Math.random() * hashChars.length)];
  }

  console.log("Transaction submitted. Mock hash:", hash);
  return hash;
}
