// Customer reviews shown on the site. Add only genuine reviews, with the customer's permission.
// The section shows them automatically, and works out the average rating from this list.
// Until the list has entries, the site shows an invitation to leave the first review instead.
//
// Format (one object per review; all measurements in inches, like the rest of the site):
// {
//   name: 'Ritu S.',              // first name and initial is enough
//   city: 'Karnal',
//   product: 'Bed mattress · 4″', // what they bought
//   rating: 5,                    // 1 to 5
//   text: 'What the customer said, in their own words.',
//   date: '2026-11',              // year-month
//   source: 'WhatsApp'            // where the review came from: WhatsApp, Google, IndiaMART, In person…
// },
export const reviews = [];
