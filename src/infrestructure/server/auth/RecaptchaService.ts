export interface RecaptchaVerifyResult {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export const RecaptchaService = {
  async verifyToken(
    captchaToken: string,
    remoteIp?: string
  ): Promise<RecaptchaVerifyResult> {
    const secret = process.env.RECAPTCHA_SECRET;

    if (!secret) {
      return { success: false, "error-codes": ["missing-secret"] };
    }

    if (!captchaToken) {
      return { success: false, "error-codes": ["missing-input-response"] };
    }

    const body = new URLSearchParams({
      secret,
      response: captchaToken,
    });

    if (remoteIp) {
      body.set("remoteip", remoteIp);
    }

    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      }
    );

    if (!response.ok) {
      return { success: false, "error-codes": ["siteverify-http-error"] };
    }

    return (await response.json()) as RecaptchaVerifyResult;
  },
};
