Add a WhatsApp share button to each job card so users can easily share jobs to the WhatsApp group. The button copies the job details to the clipboard and opens the WhatsApp group invite link in a new tab.

### User choices gathered
- **Share destination**: WhatsApp group invite link (`https://chat.whatsapp.com/IgutFNzG4xXAMSCoo6bpcf`).
- **Share content**: Title + company + Career Boost job detail page link.
- **Share placement**: On each job card in the job list.
- **Clipboard copy**: Yes — copy the job details to the clipboard, then open the group invite link.

### Implementation plan

1. **Extend the WhatsApp analytics helper** in `src/lib/whatsapp.ts`.
   - Add a new `trackJobWhatsAppShare(location: string)` function that records a `job_share_whatsapp` event with a `location` property (e.g. `job_card`) for analytics.

2. **Create a small share utility** (or inline it in the job card) to:
   - Build a shareable text string from a job: `"<title> at <company> — <detail-link>"`.
   - Copy the text to the clipboard via `navigator.clipboard.writeText()`.
   - Open the WhatsApp group invite URL in a new tab.
   - Show a toast: "Job details copied. Join the WhatsApp group to share it." (or similar).
   - Fall back silently if the clipboard write fails.

3. **Update the `JobCard` component** (`src/components/jobs/job-card.tsx`).
   - Import a WhatsApp/share icon and the new tracker.
   - Add a small WhatsApp-styled icon button to the existing action button row (next to Analyze Match, Details, and Apply).
   - The button uses the WhatsApp brand color (#25D366) for easy recognition.
   - On click, it calls the share utility with the job data.

4. **Verify** the job listing page renders correctly and the share button works.
   - Build passes with no TypeScript errors.
   - Clicking the button copies the text and opens the WhatsApp group link in a new tab.
   - Toast feedback appears.

### Technical notes
- No new dependencies are required.
- The existing `toast` helper from `sonner` is used for feedback.
- The job detail page URL is built from the same slug pattern the Details button uses: `/jobs/detail/{slug}`.
- The share button is added only to the job card component, so it appears wherever JobCard is used in the job list.