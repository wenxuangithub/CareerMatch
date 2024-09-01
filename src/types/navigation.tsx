import { StringFormat } from "firebase/storage";

export type MainStackParamList = {
  MainTabs: undefined;
  EditStudentProfile: undefined;
  Search: undefined;
  Home: undefined;
  EmployerHome: undefined;
  AdminHome: undefined;
  EmployerTabs: undefined;
  AdminTabs: undefined;
  StudentProfile: undefined;
  Template: undefined;
  DigitalCard: { userId: string };
  EditDigitalCard: { userId: string };
  WebView: { url: string };
  SavedCards: undefined;
  QRScanner: undefined;
  Notification: undefined;
  EventRegistration: { eventId: string };
  EventCreation: undefined;
  AdminEventList: undefined;
  AdminEventPanel: { eventId: string };
  EmployerEventList: undefined;
  EventListForRegistration: undefined;
  EmployerEventPanel: {
    eventId: string;
    companyId: string;
    companyName: string;
  };
  DocumentsQR: {
    eventId: string;
    companyId: string;
    companyName: string;
  };
  CompanyInfo: {
    eventId: string;
    companyId: string;
  };
  EventCompanyInfo: {
    eventId: string;
    companyId: string;
  };
  JobDetails: {
    job: {
      role: string;
      location: string;
      classification: string;
      descriptions: string;
      time: string;
    };
    companyName: string;
    eventId: string;
    companyId: string;
  };
  EventList: undefined;
  EventInfo: {eventId : string;};
  BrowseJobList: {eventId: string};
  AIJobRecommendation: {
    jobs: Job[];
    eventId: string;
  };
  ApplicationDetails: {
    applicationId: string;
  };
  EventEdit : {
    eventId : string;
  }
  AttendanceFeature: {
    eventId: string;
  };
  EventFormBuilder: {
    eventId: string;
  };
  EventFormTemplate: {
    eventId: string;
  };
  FormContentView: {
    questionnaire: {
      name: string;
      questions: Array<{
        id: string;
        type: 'text' | 'multipleChoice' | 'yesNo';
        question: string;
        options?: string[];
      }>;
    };
  };
  EventQRCode: {
    eventId: string;
  };
  EventForm: {
    eventId: string;
    questionnaireId: string;
  };
  QRRecorded: {
    message: string;
    success: boolean;
  };
  AttendanceToCSV: {
    eventId: string;
  }
  EmployerEventAnalytic: {
    eventId: string;
    companyId: string;
  };
};




export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgetPassword: undefined;
};
