export interface OutreachRecipient {
  email: string;
  institution: string;
  department: string;
  country: string;
  status: string;
  sentAt: string;
}

// Educator outreach announcement recipients. This is the historical record of
// every mailbox the announcement was sent to (see outreach/sent-log.json).
export const OUTREACH_RECIPIENTS: OutreachRecipient[] = [
  { email: "classics-department@uchicago.edu", institution: "University of Chicago", department: "Classics", country: "US", status: "sent", sentAt: "2026-06-12T16:30:20.034Z" },
  { email: "clasdept@uw.edu", institution: "University of Washington", department: "Classics", country: "US", status: "sent", sentAt: "2026-06-12T16:30:20.826Z" },
  { email: "classics@fas.harvard.edu", institution: "Harvard University", department: "Classics", country: "US", status: "sent", sentAt: "2026-06-12T16:30:21.640Z" },
  { email: "classics@umich.edu", institution: "University of Michigan", department: "Classical Studies", country: "US", status: "sent", sentAt: "2026-06-12T16:30:22.503Z" },
  { email: "dus.classics@yale.edu", institution: "Yale University", department: "Classics", country: "US", status: "sent", sentAt: "2026-06-12T16:30:23.315Z" },
  { email: "classics@bu.edu", institution: "Boston University", department: "Classics", country: "US", status: "sent", sentAt: "2026-06-12T16:30:24.175Z" },
  { email: "classics_department@brown.edu", institution: "Brown University", department: "Classics", country: "US", status: "sent", sentAt: "2026-06-12T16:30:24.996Z" },
  { email: "classics@nd.edu", institution: "University of Notre Dame", department: "Classics", country: "US", status: "sent", sentAt: "2026-06-12T16:30:25.823Z" },
  { email: "classics@tulane.edu", institution: "Tulane University", department: "Classical Studies", country: "US", status: "sent", sentAt: "2026-06-12T16:30:26.728Z" },
  { email: "classics@amherst.edu", institution: "Amherst College", department: "Classics", country: "US", status: "sent", sentAt: "2026-06-12T16:30:27.521Z" },
  { email: "classics@ku.edu", institution: "University of Kansas", department: "Classics", country: "US", status: "sent", sentAt: "2026-06-12T16:30:28.296Z" },
  { email: "modernlang@luc.edu", institution: "Loyola University Chicago", department: "Modern Languages", country: "US", status: "sent", sentAt: "2026-06-12T16:30:29.087Z" },
  { email: "languages@louisiana.edu", institution: "University of Louisiana at Lafayette", department: "Modern Languages", country: "US", status: "sent", sentAt: "2026-06-12T16:30:29.892Z" },
  { email: "reception@classics.ox.ac.uk", institution: "University of Oxford", department: "Classics", country: "UK", status: "sent", sentAt: "2026-06-12T16:30:30.698Z" },
  { email: "receptionist@classics.cam.ac.uk", institution: "University of Cambridge", department: "Classics", country: "UK", status: "sent", sentAt: "2026-06-12T16:30:31.546Z" },
  { email: "classics.dept@utoronto.ca", institution: "University of Toronto", department: "Classics", country: "CA", status: "sent", sentAt: "2026-06-12T16:30:32.350Z" },
  { email: "info@classicalstudies.org", institution: "Society for Classical Studies", department: "Association", country: "US", status: "sent", sentAt: "2026-06-12T16:30:33.180Z" },
  { email: "hmansfield@gov.harvard.edu", institution: "Harvard University", department: "Government (Prof. Harvey Mansfield)", country: "US", status: "sent", sentAt: "2026-06-12T16:39:49.834Z" },
  { email: "info@scruton.org", institution: "Roger Scruton Legacy Foundation", department: "Institute", country: "UK", status: "sent", sentAt: "2026-06-12T16:39:50.650Z" },
  { email: "library-reference@stanford.edu", institution: "Stanford University", department: "Library", country: "US", status: "sent", sentAt: "2026-06-12T16:39:51.452Z" },
  { email: "help.desk@utoronto.ca", institution: "University of Toronto", department: "Library", country: "CA", status: "sent", sentAt: "2026-06-12T16:39:52.256Z" },
  { email: "library@amherst.edu", institution: "Amherst College", department: "Library", country: "US", status: "sent", sentAt: "2026-06-12T16:39:53.074Z" },
  { email: "ask@bu.edu", institution: "Boston University", department: "Library", country: "US", status: "sent", sentAt: "2026-06-12T16:39:53.887Z" },
  { email: "libref@syr.edu", institution: "Syracuse University", department: "Library", country: "US", status: "sent", sentAt: "2026-06-12T16:39:54.660Z" },
  { email: "askyalelibrary@yale.edu", institution: "Yale University", department: "Library", country: "US", status: "sent", sentAt: "2026-06-12T16:39:55.477Z" },
  { email: "askalibrarian@psu.edu", institution: "Pennsylvania State University", department: "Library", country: "US", status: "sent", sentAt: "2026-06-12T16:39:56.323Z" },
  { email: "libraryinfo@ucd.ie", institution: "University College Dublin", department: "Library", country: "IE", status: "sent", sentAt: "2026-06-12T16:39:57.128Z" },
  { email: "library@glasgow.ac.uk", institution: "University of Glasgow", department: "Library", country: "UK", status: "sent", sentAt: "2026-06-12T16:39:57.931Z" },
  { email: "library@lincoln.ac.uk", institution: "University of Lincoln", department: "Library", country: "UK", status: "sent", sentAt: "2026-06-12T16:39:58.724Z" },
];
