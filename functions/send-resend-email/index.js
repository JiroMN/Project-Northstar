import { Resend } from "resend";

export default async ({ req, res, log }) => {
  try {
    const payload = req.bodyJson ?? {};

    const apiKey = process.env.RESEND_API_KEY;
    const from =
      payload.from ??
      "Jiro Niedeveld | TheBrand.Estate <jiro@thebrand.estate>";
    const brandDirectorEmail =
      payload.brandDirectorEmail ?? "jiro@thebrand.estate";
    const customerEmail = payload.customerEmail;

    if (!apiKey) {
      throw new Error("Missing RESEND_API_KEY");
    }

    const resend = new Resend(apiKey);

    const internalTemplateId = payload.internalTemplateId;
    const customerTemplateId = payload.customerTemplateId;

    const variables = {
      ...(payload.templateVariables ?? {}),
      customerEmail: customerEmail,
      customerName: payload.customerName ?? "",
      companyName: payload.companyName ?? "",
    };

    const replyTo = payload.replyTo ?? "jiro@thebrand.estate";
    const internalSubject =
      payload.internalSubject ?? "Nieuwe continuity-uren aanvraag";
    const customerSubject =
      payload.customerSubject ??
      "Bevestiging: continuity-uren aanvraag ontvangen";

    async function sendEmail({ to, subject, templateId }) {
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        replyTo: replyTo,
        template: {
          id: templateId,
          variables,
        },
      });

      if (error) {
        throw new Error(error.message ?? "Unknown Resend SDK error");
      }

      return data;
    }

    // 1) Always notify brand director first
    const internalEmail = await sendEmail({
      to: brandDirectorEmail,
      subject: internalSubject,
      templateId: internalTemplateId,
    });

    if (!internalEmail?.id) {
      throw new Error("Internal email send did not return a valid id");
    }

    // 2) Only after internal mail succeeded, send confirmation to customer
    const customerEmailResult = await sendEmail({
      to: customerEmail,
      subject: customerSubject,
      templateId: customerTemplateId,
    });

    if (!customerEmailResult?.id) {
      throw new Error("Customer email send did not return a valid id");
    }

    return res.json({
      ok: true,
      internalEmail,
      customerEmail: customerEmailResult,
    });
  } catch (error) {
    log("Resend error:", error.message);

    return res.json({
      ok: false,
      error: error.message,
    }, 500);
  }
};
