import { DEFAULT_LOCALE, type Locale } from "./config";

/**
 * Flat, dot-namespaced translation dictionaries. Every user-facing string in
 * the app segment lives here. Use `{name}`-style placeholders for values that
 * are interpolated at call time via the second argument of `t()`.
 *
 * Email addresses, phone numbers and people's own data (employee names,
 * management names, free-text content) are intentionally NOT translated.
 */

export type Messages = Record<string, string>;

const en: Messages = {
  // Generic / shared
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.saveChanges": "Save changes",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.rename": "Rename",
  "common.add": "Add",
  "common.confirm": "Confirm",
  "common.working": "Working…",
  "common.actions": "Actions",
  "common.optional": "(optional)",
  "common.download": "Download",
  "common.downloadPdf": "Download PDF",
  "common.print": "Print",
  "common.status": "Status",
  "common.date": "Date",
  "common.content": "Content",
  "common.employee": "Employee",
  "common.employees": "Employees",
  "common.management": "Management",
  "common.managementDepartment": "Management / department",
  "common.name": "Name",
  "common.position": "Position",
  "common.email": "Email",
  "common.pending": "Pending",
  "common.done": "Done",
  "common.total": "total",
  "common.searchContent": "Search content…",
  "common.allStatuses": "All statuses",
  "common.allManagements": "All managements",
  "common.allEmployees": "All employees",

  // Navigation
  "nav.appName": "Tracker",
  "nav.dashboard": "Dashboard",
  "nav.applications": "Applications",
  "nav.events": "Events",
  "nav.employees": "Employees",
  "nav.managements": "Managements",
  "nav.account": "Account menu",
  "nav.switchToArabic": "العربية",
  "nav.switchToEnglish": "English",
  "nav.language": "Language",

  // Supervisor profile (dashboard header)
  "profile.name": "Sana Shaker Alderazi",
  "profile.title": "Senior Psychological Counseling Specialist",
  "profile.group": "Student Psychological Counseling Group",
  "profile.emailLabel": "Email:",

  // Dashboard
  "dashboard.welcome": "Welcome back, {name}",
  "dashboard.subtitle": "An overview of your team's applications and feedback.",
  "dashboard.newApplication": "New application",
  "dashboard.totalApplications": "Total applications",
  "dashboard.employees": "Employees",
  "dashboard.empty.title": "Nothing to track yet",
  "dashboard.empty.desc":
    "Add an employee, then assign their first application to get started.",
  "dashboard.goToEmployees": "Go to employees",
  "dashboard.recentPending": "Recent pending applications",
  "dashboard.viewAll": "View all",
  "dashboard.caughtUp": "🎉 No pending applications — you're all caught up.",
  "dashboard.byManagement": "By management",
  "dashboard.noAppsYet": "No applications yet.",
  "dashboard.unassigned": "Unassigned",

  // Applications list
  "applications.title": "Applications",
  "applications.subtitle": "Every application across your team.",
  "applications.subtitlePending": "Applications still awaiting feedback.",
  "applications.subtitleDone": "Applications with feedback recorded.",
  "applications.none.title": "No applications yet",
  "applications.none.desc":
    "Add an employee, then assign their first application to get started.",
  "applications.noMatch.title": "No applications match your filters",
  "applications.noMatch.desc":
    "Try a different search term or status filter.",

  // New application
  "newApp.title": "New application",
  "newApp.subtitle": "Fill in the details to assign a new application.",
  "newApp.needEmployee.title": "Add an employee first",
  "newApp.needEmployee.desc":
    "Applications are assigned to employees, so you'll need at least one before creating an application.",

  // Application dialog
  "appDialog.editTitle": "Edit application",
  "appDialog.addTitle": "Add application",
  "appDialog.editDesc": "Update the details of this application.",
  "appDialog.addDesc":
    "Assign a new application to an employee. Feedback is recorded later.",
  "appDialog.selectEmployee": "Select an employee",
  "appDialog.managementHint": "Pick from your list or type a new one to create it.",
  "appDialog.contentPlaceholder": "Describe the application…",
  "appDialog.applicationDate": "Application date",
  "appDialog.added": "Application added.",
  "appDialog.updated": "Application updated.",

  // Application detail
  "appDetail.backToManagement": "Back to {name}",
  "appDetail.backToEmployee": "Back to {name}",
  "appDetail.backToEmployees": "Back to employees",
  "appDetail.backToApplications": "Back to applications",
  "appDetail.management": "management",
  "appDetail.heading": "Application",
  "appDetail.deleteAria": "Delete application",
  "appDetail.applicationDate": "Application date",
  "appDetail.feedback": "Feedback",
  "appDetail.editFeedback": "Edit feedback",
  "appDetail.clear": "Clear",
  "appDetail.recorded": "Recorded {date}",
  "appDetail.noFeedbackYet":
    "No feedback yet — add it below to mark this application Done.",
  "appDetail.feedbackPlaceholder": "Write your feedback…",
  "appDetail.feedbackDate": "Feedback date",
  "appDetail.updateFeedback": "Update feedback",
  "appDetail.saveFeedback": "Save feedback",
  "appDetail.deleteTitle": "Delete this application?",
  "appDetail.deleteDesc":
    "This permanently deletes the application and its feedback. This cannot be undone.",
  "appDetail.deleted": "Application deleted.",
  "appDetail.clearTitle": "Clear feedback?",
  "appDetail.clearDesc":
    "This removes the feedback and returns the application to Pending.",
  "appDetail.clearConfirm": "Clear feedback",
  "appDetail.feedbackCleared": "Feedback cleared.",
  "appDetail.feedbackUpdated": "Feedback updated.",
  "appDetail.feedbackSaved": "Feedback saved.",
  "appDetail.invalidInput": "Invalid input",

  // Employees list
  "employees.title": "Employees",
  "employees.subtitle": "Everyone on your team and their application workload.",
  "employees.add": "Add employee",
  "employees.none.title": "No employees yet",
  "employees.none.desc":
    "Add your first team member to start assigning and tracking applications.",
  "employees.addFirst": "Add your first employee",
  "employees.colApplications": "Applications",
  "employees.deleted": "Employee deleted.",
  "employees.deleteTitle": "Delete {name}?",
  "employees.deleteWithApps":
    "This will permanently delete {name} and their {count} application(s). This cannot be undone.",
  "employees.deleteDesc":
    "This will permanently delete this employee. This cannot be undone.",

  // Employee dialog
  "empDialog.editTitle": "Edit employee",
  "empDialog.addTitle": "Add employee",
  "empDialog.editDesc": "Update this employee's details.",
  "empDialog.addDesc":
    "Add someone to your team to start assigning applications.",
  "empDialog.namePlaceholder": "John Smith",
  "empDialog.positionPlaceholder": "Analyst",
  "empDialog.emailPlaceholder": "john@example.com",
  "empDialog.added": "Employee added.",
  "empDialog.updated": "Employee updated.",

  // Employee detail
  "empDetail.backToEmployees": "Back to employees",
  "empDetail.pending": "pending",
  "empDetail.done": "done",
  "empDetail.monthlyReport": "Monthly report",
  "empDetail.allTimeReport": "All-time report",
  "empDetail.printableView": "Printable view",
  "empDetail.addApplication": "Add application",
  "empDetail.applications": "Applications",
  "empDetail.none.title": "No applications yet",
  "empDetail.none.desc": "Assign the first application to {name}.",
  "empDetail.noMatch.title": "No applications match your filters",
  "empDetail.noMatch.desc":
    "Try a different search term, status or management filter.",

  // Monthly report
  "monthly.title": "Monthly report",
  "monthly.desc": "A cover page plus every application for the selected month.",
  "monthly.month": "Month",
  "monthly.download": "Download {month}",

  // Managements list
  "managements.title": "Managements",
  "managements.subtitle":
    "Your reusable list of managements / departments. Pick these when creating applications.",
  "managements.addCard": "Add a management",
  "managements.namePlaceholder": "e.g. Finance Department",
  "managements.none.title": "No managements yet",
  "managements.none.desc":
    "Add your first management or department above. You can also create them on the fly when adding an application.",
  "managements.colApplications": "Applications",
  "managements.added": "Management added.",
  "managements.renamed": "Management renamed.",
  "managements.deleted": "Management deleted.",
  "managements.renameTitle": "Rename management",
  "managements.deleteTitle": 'Delete "{name}"?',
  "managements.deleteDesc":
    "Past applications keep their management name and won't be deleted — they'll just be detached from this list.",

  // Management detail
  "mgmtDetail.backToManagements": "Back to managements",
  "mgmtDetail.pending": "pending",
  "mgmtDetail.done": "done",
  "mgmtDetail.employee": "employee",
  "mgmtDetail.employees": "employees",
  "mgmtDetail.applications": "Applications",
  "mgmtDetail.none.title": "No applications yet",
  "mgmtDetail.none.desc": "No applications have been recorded under {name}.",
  "mgmtDetail.noMatch.title": "No applications match your filters",
  "mgmtDetail.noMatch.desc":
    "Try a different search term, status or employee filter.",

  // Management combobox
  "combobox.placeholder": "Select or type a management…",
  "combobox.searchOrCreate": "Search or create…",
  "combobox.notFound": "No management found.",
  "combobox.yourManagements": "Your managements",
  "combobox.createNew": "Create new",
  "combobox.create": 'Create "{name}"',

  // Events list
  "events.title": "Events",
  "events.subtitle": "Activities and programs from the annual plan.",
  "events.add": "Add event",
  "events.addFirst": "Add your first event",
  "events.none.title": "No events yet",
  "events.none.desc": "Add your first event or program to get started.",
  "events.searchPlaceholder": "Search events…",
  "events.noMatch.title": "No events match your search",
  "events.noMatch.desc": "Try a different search term.",
  "events.colMonth": "Month",
  "events.colProgram": "Program",
  "events.colPeriod": "Period",
  "events.colTarget": "Target group",
  "events.colResponsible": "Responsible",
  "events.deleteTitle": "Delete this event?",
  "events.deleteDesc":
    "This permanently deletes the event and all its recorded attendance. This cannot be undone.",
  "events.deleted": "Event deleted.",

  // Event dialog
  "eventDialog.addTitle": "Add event",
  "eventDialog.editTitle": "Edit event",
  "eventDialog.addDesc": "Add a program or activity to the plan.",
  "eventDialog.editDesc": "Update this event's details.",
  "eventDialog.name": "Program name",
  "eventDialog.namePlaceholder": "e.g. Awareness program",
  "eventDialog.month": "Month",
  "eventDialog.monthPlaceholder": "e.g. September",
  "eventDialog.period": "Period",
  "eventDialog.periodPlaceholder": "e.g. 1–30/9/2026",
  "eventDialog.target": "Target group",
  "eventDialog.targetPlaceholder": "e.g. Students",
  "eventDialog.notes": "Notes",
  "eventDialog.notesPlaceholder": "Notes…",
  "eventDialog.responsible": "Responsible employee",
  "eventDialog.selectEmployee": "Select an employee",
  "eventDialog.unassigned": "Unassigned",
  "eventDialog.added": "Event added.",
  "eventDialog.updated": "Event updated.",

  // Event detail
  "eventDetail.back": "Back to events",
  "eventDetail.responsible": "Responsible",
  "eventDetail.month": "Month",
  "eventDetail.period": "Period",
  "eventDetail.target": "Target group",
  "eventDetail.notes": "Notes",
  "eventDetail.unassigned": "Unassigned",
  "eventDetail.editEvent": "Edit event",
  "eventDetail.deleteEvent": "Delete event",
  "eventDetail.scheduleTitle": "Visit schedule & attendance",
  "eventDetail.scheduleDesc":
    "Choose an employee to see their schools and record attendance for this event.",
  "eventDetail.selectEmployee": "Choose an employee",
  "eventDetail.pickEmployeePrompt":
    "Select an employee above to view and edit their schedule for this event.",
  "eventDetail.loading": "Loading…",
  "eventDetail.colSchool": "School",
  "eventDetail.colDate": "Visit date",
  "eventDetail.colAttendance": "Attendance",
  "eventDetail.colStatus": "Status",
  "eventDetail.schoolPlaceholder": "School name",
  "eventDetail.markDone": "Mark done",
  "eventDetail.markPending": "Mark pending",
  "eventDetail.addRow": "Add school",
  "eventDetail.deleteRow": "Remove",
  "eventDetail.emptySchedule":
    "No schedule for this employee yet. Add a school below.",
  "eventDetail.deleteRowTitle": "Remove this school?",
  "eventDetail.deleteRowDesc":
    "This removes the school from this event only. This cannot be undone.",
  "eventDetail.rowsDoneOfTotal": "{done} of {total} done",
  "eventDetail.downloadReport": "Download report",
  "eventDetail.downloadEmployeeReport": "Download this employee's report",
  "eventDetail.stats.employees": "Employees",
  "eventDetail.stats.schoolsDone": "Schools done",
  "eventDetail.stats.attendance": "Total attendance",
  "eventDetail.stats.completion": "Completion",

  // Error boundary
  "error.title": "Something went wrong",
  "error.desc": "An unexpected error occurred. Please try again.",
  "error.retry": "Try again",
};

const ar: Messages = {
  // Generic / shared
  "common.cancel": "إلغاء",
  "common.save": "حفظ",
  "common.saving": "جارٍ الحفظ…",
  "common.saveChanges": "حفظ التغييرات",
  "common.delete": "حذف",
  "common.edit": "تعديل",
  "common.rename": "إعادة تسمية",
  "common.add": "إضافة",
  "common.confirm": "تأكيد",
  "common.working": "جارٍ التنفيذ…",
  "common.actions": "إجراءات",
  "common.optional": "(اختياري)",
  "common.download": "تنزيل",
  "common.downloadPdf": "تنزيل PDF",
  "common.print": "طباعة",
  "common.status": "الحالة",
  "common.date": "التاريخ",
  "common.content": "المحتوى",
  "common.employee": "الموظف",
  "common.employees": "الموظفون",
  "common.management": "الإدارة",
  "common.managementDepartment": "الإدارة / القسم",
  "common.name": "الاسم",
  "common.position": "المسمى الوظيفي",
  "common.email": "البريد الإلكتروني",
  "common.pending": "قيد الانتظار",
  "common.done": "مكتمل",
  "common.total": "الإجمالي",
  "common.searchContent": "بحث في المحتوى…",
  "common.allStatuses": "كل الحالات",
  "common.allManagements": "كل الإدارات",
  "common.allEmployees": "كل الموظفين",

  // Navigation
  "nav.appName": "المتابعة",
  "nav.dashboard": "لوحة المعلومات",
  "nav.applications": "الطلبات",
  "nav.events": "الفعاليات",
  "nav.employees": "الموظفون",
  "nav.managements": "الإدارات",
  "nav.account": "قائمة الحساب",
  "nav.switchToArabic": "العربية",
  "nav.switchToEnglish": "English",
  "nav.language": "اللغة",

  // Supervisor profile (dashboard header)
  "profile.name": "سناء شاكر الدرازي",
  "profile.title": "اختصاصي إرشاد نفسي أول",
  "profile.group": "مجموعة الإرشاد النفسي للطلبة",
  "profile.emailLabel": "البريد الإلكتروني:",

  // Dashboard
  "dashboard.welcome": "مرحبًا بعودتك، {name}",
  "dashboard.subtitle": "نظرة عامة على طلبات فريقك والملاحظات المسجّلة عليها.",
  "dashboard.newApplication": "طلب جديد",
  "dashboard.totalApplications": "إجمالي الطلبات",
  "dashboard.employees": "الموظفون",
  "dashboard.empty.title": "لا يوجد ما تتم متابعته بعد",
  "dashboard.empty.desc": "أضِف موظفًا ثم أسنِد إليه أول طلب للبدء.",
  "dashboard.goToEmployees": "الذهاب إلى الموظفين",
  "dashboard.recentPending": "أحدث الطلبات قيد الانتظار",
  "dashboard.viewAll": "عرض الكل",
  "dashboard.caughtUp": "🎉 لا توجد طلبات قيد الانتظار — لقد أنجزت كل شيء.",
  "dashboard.byManagement": "حسب الإدارة",
  "dashboard.noAppsYet": "لا توجد طلبات بعد.",
  "dashboard.unassigned": "غير مُسندة",

  // Applications list
  "applications.title": "الطلبات",
  "applications.subtitle": "جميع الطلبات على مستوى فريقك.",
  "applications.subtitlePending": "الطلبات التي لا تزال بانتظار الملاحظات.",
  "applications.subtitleDone": "الطلبات التي سُجّلت لها ملاحظات.",
  "applications.none.title": "لا توجد طلبات بعد",
  "applications.none.desc": "أضِف موظفًا ثم أسنِد إليه أول طلب للبدء.",
  "applications.noMatch.title": "لا توجد طلبات مطابقة للفلاتر",
  "applications.noMatch.desc": "جرّب كلمة بحث مختلفة أو فلتر حالة آخر.",

  // New application
  "newApp.title": "طلب جديد",
  "newApp.subtitle": "املأ التفاصيل لإسناد طلب جديد.",
  "newApp.needEmployee.title": "أضِف موظفًا أولاً",
  "newApp.needEmployee.desc":
    "تُسنَد الطلبات إلى الموظفين، لذا تحتاج إلى موظف واحد على الأقل قبل إنشاء طلب.",

  // Application dialog
  "appDialog.editTitle": "تعديل الطلب",
  "appDialog.addTitle": "إضافة طلب",
  "appDialog.editDesc": "حدّث تفاصيل هذا الطلب.",
  "appDialog.addDesc": "أسنِد طلبًا جديدًا إلى موظف. تُسجَّل الملاحظات لاحقًا.",
  "appDialog.selectEmployee": "اختر موظفًا",
  "appDialog.managementHint":
    "اختر من قائمتك أو اكتب اسمًا جديدًا لإنشائه.",
  "appDialog.contentPlaceholder": "صِف الطلب…",
  "appDialog.applicationDate": "تاريخ الطلب",
  "appDialog.added": "تمت إضافة الطلب.",
  "appDialog.updated": "تم تحديث الطلب.",

  // Application detail
  "appDetail.backToManagement": "العودة إلى {name}",
  "appDetail.backToEmployee": "العودة إلى {name}",
  "appDetail.backToEmployees": "العودة إلى الموظفين",
  "appDetail.backToApplications": "العودة إلى الطلبات",
  "appDetail.management": "الإدارة",
  "appDetail.heading": "الطلب",
  "appDetail.deleteAria": "حذف الطلب",
  "appDetail.applicationDate": "تاريخ الطلب",
  "appDetail.feedback": "الملاحظات",
  "appDetail.editFeedback": "تعديل الملاحظات",
  "appDetail.clear": "مسح",
  "appDetail.recorded": "سُجِّلت في {date}",
  "appDetail.noFeedbackYet":
    "لا توجد ملاحظات بعد — أضِفها بالأسفل لتحديد الطلب كمكتمل.",
  "appDetail.feedbackPlaceholder": "اكتب ملاحظاتك…",
  "appDetail.feedbackDate": "تاريخ الملاحظات",
  "appDetail.updateFeedback": "تحديث الملاحظات",
  "appDetail.saveFeedback": "حفظ الملاحظات",
  "appDetail.deleteTitle": "حذف هذا الطلب؟",
  "appDetail.deleteDesc":
    "سيؤدي هذا إلى حذف الطلب وملاحظاته نهائيًا. لا يمكن التراجع عن ذلك.",
  "appDetail.deleted": "تم حذف الطلب.",
  "appDetail.clearTitle": "مسح الملاحظات؟",
  "appDetail.clearDesc":
    "سيؤدي هذا إلى إزالة الملاحظات وإعادة الطلب إلى حالة قيد الانتظار.",
  "appDetail.clearConfirm": "مسح الملاحظات",
  "appDetail.feedbackCleared": "تم مسح الملاحظات.",
  "appDetail.feedbackUpdated": "تم تحديث الملاحظات.",
  "appDetail.feedbackSaved": "تم حفظ الملاحظات.",
  "appDetail.invalidInput": "مدخل غير صالح",

  // Employees list
  "employees.title": "الموظفون",
  "employees.subtitle": "جميع أعضاء فريقك وحجم طلبات كل منهم.",
  "employees.add": "إضافة موظف",
  "employees.none.title": "لا يوجد موظفون بعد",
  "employees.none.desc":
    "أضِف أول عضو في فريقك لبدء إسناد الطلبات ومتابعتها.",
  "employees.addFirst": "أضِف أول موظف",
  "employees.colApplications": "الطلبات",
  "employees.deleted": "تم حذف الموظف.",
  "employees.deleteTitle": "حذف {name}؟",
  "employees.deleteWithApps":
    "سيؤدي هذا إلى حذف {name} و{count} من طلباته نهائيًا. لا يمكن التراجع عن ذلك.",
  "employees.deleteDesc":
    "سيؤدي هذا إلى حذف هذا الموظف نهائيًا. لا يمكن التراجع عن ذلك.",

  // Employee dialog
  "empDialog.editTitle": "تعديل الموظف",
  "empDialog.addTitle": "إضافة موظف",
  "empDialog.editDesc": "حدّث بيانات هذا الموظف.",
  "empDialog.addDesc": "أضِف شخصًا إلى فريقك لبدء إسناد الطلبات.",
  "empDialog.namePlaceholder": "محمد أحمد",
  "empDialog.positionPlaceholder": "محلل",
  "empDialog.emailPlaceholder": "name@example.com",
  "empDialog.added": "تمت إضافة الموظف.",
  "empDialog.updated": "تم تحديث الموظف.",

  // Employee detail
  "empDetail.backToEmployees": "العودة إلى الموظفين",
  "empDetail.pending": "قيد الانتظار",
  "empDetail.done": "مكتمل",
  "empDetail.monthlyReport": "التقرير الشهري",
  "empDetail.allTimeReport": "تقرير شامل",
  "empDetail.printableView": "عرض قابل للطباعة",
  "empDetail.addApplication": "إضافة طلب",
  "empDetail.applications": "الطلبات",
  "empDetail.none.title": "لا توجد طلبات بعد",
  "empDetail.none.desc": "أسنِد أول طلب إلى {name}.",
  "empDetail.noMatch.title": "لا توجد طلبات مطابقة للفلاتر",
  "empDetail.noMatch.desc": "جرّب كلمة بحث أو حالة أو فلتر إدارة مختلف.",

  // Monthly report
  "monthly.title": "التقرير الشهري",
  "monthly.desc": "صفحة غلاف بالإضافة إلى كل طلبات الشهر المحدد.",
  "monthly.month": "الشهر",
  "monthly.download": "تنزيل {month}",

  // Managements list
  "managements.title": "الإدارات",
  "managements.subtitle":
    "قائمتك القابلة لإعادة الاستخدام بالإدارات / الأقسام. اخترها عند إنشاء الطلبات.",
  "managements.addCard": "إضافة إدارة",
  "managements.namePlaceholder": "مثال: إدارة الشؤون المالية",
  "managements.none.title": "لا توجد إدارات بعد",
  "managements.none.desc":
    "أضِف أول إدارة أو قسم بالأعلى. يمكنك أيضًا إنشاؤها مباشرة عند إضافة طلب.",
  "managements.colApplications": "الطلبات",
  "managements.added": "تمت إضافة الإدارة.",
  "managements.renamed": "تمت إعادة تسمية الإدارة.",
  "managements.deleted": "تم حذف الإدارة.",
  "managements.renameTitle": "إعادة تسمية الإدارة",
  "managements.deleteTitle": "حذف «{name}»؟",
  "managements.deleteDesc":
    "تحتفظ الطلبات السابقة باسم إدارتها ولن تُحذف — سيتم فقط فصلها عن هذه القائمة.",

  // Management detail
  "mgmtDetail.backToManagements": "العودة إلى الإدارات",
  "mgmtDetail.pending": "قيد الانتظار",
  "mgmtDetail.done": "مكتمل",
  "mgmtDetail.employee": "موظف",
  "mgmtDetail.employees": "موظفين",
  "mgmtDetail.applications": "الطلبات",
  "mgmtDetail.none.title": "لا توجد طلبات بعد",
  "mgmtDetail.none.desc": "لم تُسجَّل أي طلبات ضمن {name}.",
  "mgmtDetail.noMatch.title": "لا توجد طلبات مطابقة للفلاتر",
  "mgmtDetail.noMatch.desc": "جرّب كلمة بحث أو حالة أو فلتر موظف مختلف.",

  // Management combobox
  "combobox.placeholder": "اختر أو اكتب إدارة…",
  "combobox.searchOrCreate": "ابحث أو أنشئ…",
  "combobox.notFound": "لم يتم العثور على إدارة.",
  "combobox.yourManagements": "إداراتك",
  "combobox.createNew": "إنشاء جديد",
  "combobox.create": "إنشاء «{name}»",

  // Events list
  "events.title": "الفعاليات",
  "events.subtitle": "فعاليات وأنشطة الخطة السنوية.",
  "events.add": "إضافة فعالية",
  "events.addFirst": "أضِف أول فعالية",
  "events.none.title": "لا توجد فعاليات بعد",
  "events.none.desc": "أضِف أول فعالية أو برنامج للبدء.",
  "events.searchPlaceholder": "بحث في الفعاليات…",
  "events.noMatch.title": "لا توجد فعاليات مطابقة للبحث",
  "events.noMatch.desc": "جرّب كلمة بحث مختلفة.",
  "events.colMonth": "الشهر",
  "events.colProgram": "البرنامج",
  "events.colPeriod": "الفترة الزمنية",
  "events.colTarget": "الفئة المستهدفة",
  "events.colResponsible": "المسؤول",
  "events.deleteTitle": "حذف هذه الفعالية؟",
  "events.deleteDesc":
    "سيؤدي هذا إلى حذف الفعالية وكل بيانات الحضور المسجّلة نهائيًا. لا يمكن التراجع عن ذلك.",
  "events.deleted": "تم حذف الفعالية.",

  // Event dialog
  "eventDialog.addTitle": "إضافة فعالية",
  "eventDialog.editTitle": "تعديل الفعالية",
  "eventDialog.addDesc": "أضِف برنامجًا أو نشاطًا إلى الخطة.",
  "eventDialog.editDesc": "حدّث تفاصيل هذه الفعالية.",
  "eventDialog.name": "اسم البرنامج",
  "eventDialog.namePlaceholder": "مثال: برنامج توعوي",
  "eventDialog.month": "الشهر",
  "eventDialog.monthPlaceholder": "مثال: سبتمبر",
  "eventDialog.period": "الفترة الزمنية",
  "eventDialog.periodPlaceholder": "مثال: ١-٣٠/٩/٢٠٢٦",
  "eventDialog.target": "الفئة المستهدفة",
  "eventDialog.targetPlaceholder": "مثال: طلبة المدارس",
  "eventDialog.notes": "الملاحظات",
  "eventDialog.notesPlaceholder": "ملاحظات…",
  "eventDialog.responsible": "الموظف المسؤول",
  "eventDialog.selectEmployee": "اختر موظفًا",
  "eventDialog.unassigned": "غير مُسند",
  "eventDialog.added": "تمت إضافة الفعالية.",
  "eventDialog.updated": "تم تحديث الفعالية.",

  // Event detail
  "eventDetail.back": "العودة إلى الفعاليات",
  "eventDetail.responsible": "المسؤول",
  "eventDetail.month": "الشهر",
  "eventDetail.period": "الفترة الزمنية",
  "eventDetail.target": "الفئة المستهدفة",
  "eventDetail.notes": "الملاحظات",
  "eventDetail.unassigned": "غير مُسند",
  "eventDetail.editEvent": "تعديل الفعالية",
  "eventDetail.deleteEvent": "حذف الفعالية",
  "eventDetail.scheduleTitle": "جدول الزيارات والحضور",
  "eventDetail.scheduleDesc":
    "اختر موظفًا لعرض مدارسه وتسجيل الحضور لهذه الفعالية.",
  "eventDetail.selectEmployee": "اختر موظفًا",
  "eventDetail.pickEmployeePrompt":
    "اختر موظفًا بالأعلى لعرض وتعديل جدوله لهذه الفعالية.",
  "eventDetail.loading": "جارٍ التحميل…",
  "eventDetail.colSchool": "المدرسة",
  "eventDetail.colDate": "تاريخ الزيارة",
  "eventDetail.colAttendance": "عدد الحضور",
  "eventDetail.colStatus": "الحالة",
  "eventDetail.schoolPlaceholder": "اسم المدرسة",
  "eventDetail.markDone": "تحديد كمكتمل",
  "eventDetail.markPending": "إرجاع لقيد الانتظار",
  "eventDetail.addRow": "إضافة مدرسة",
  "eventDetail.deleteRow": "إزالة",
  "eventDetail.emptySchedule":
    "لا يوجد جدول لهذا الموظف بعد. أضِف مدرسة بالأسفل.",
  "eventDetail.deleteRowTitle": "إزالة هذه المدرسة؟",
  "eventDetail.deleteRowDesc":
    "سيؤدي هذا إلى إزالة المدرسة من هذه الفعالية فقط. لا يمكن التراجع عن ذلك.",
  "eventDetail.rowsDoneOfTotal": "{done} من {total} مكتملة",
  "eventDetail.downloadReport": "تنزيل التقرير",
  "eventDetail.downloadEmployeeReport": "تنزيل تقرير هذا الموظف",
  "eventDetail.stats.employees": "الموظفون",
  "eventDetail.stats.schoolsDone": "المدارس المكتملة",
  "eventDetail.stats.attendance": "إجمالي الحضور",
  "eventDetail.stats.completion": "نسبة الإنجاز",

  // Error boundary
  "error.title": "حدث خطأ ما",
  "error.desc": "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
  "error.retry": "حاول مرة أخرى",
};

export const dictionaries: Record<Locale, Messages> = { en, ar };

/** Interpolate `{key}` placeholders with provided values. */
function interpolate(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}

/** Translate a key for a locale, falling back to the default locale then the key. */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const table = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  const template = table[key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
  return interpolate(template, vars);
}

export type TFunction = (
  key: string,
  vars?: Record<string, string | number>
) => string;
