export const FORM_MODALS = {
  redeemContinuityHours: {
    heading: "Continuity uren verzilveren",
    body: "Vul de gegevens in om de aanvraag te versturen. Er zal zo snel mogelijk contact met je worden opgenomen met een verwachtte tijdsindicatie.",
    cancelText: "Annuleer",
    confirmText: "Verstuur",
    resendTemplate: "redeem_continuity_hours",
    formId: "redeemContinuityHoursForm",
    inputs: [
      {
        name: "title",
        placeholder: "Titel",
        type: "text",
        required: true,
      },
      {
        name: "deadline",
        placeholder: "Wat is de urgentie? (1-10)",
        type: "number",
        min: 1,
        max: 10,
        required: true,
      },
      {
        name: "description",
        placeholder: "Omschrijf de werkzaamheden zo goed mogelijk",
        type: "textarea",
        required: false,
      },
    ],
  },
};

export default FORM_MODALS;
