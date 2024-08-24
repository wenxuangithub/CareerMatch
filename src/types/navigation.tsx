export type MainStackParamList = {
	MainTabs: undefined;
	EditStudentProfile: undefined;
	Search:undefined;
	Home : undefined;
	EmployerHome: undefined;
	AdminHome: undefined;
	EmployerTabs : undefined;
	AdminTabs : undefined;
	StudentProfile : undefined;
	Template : undefined;
	DigitalCard : {userId : string};
	EditDigitalCard : {userId : string} ;
	WebView : {url : string};
	SavedCards : undefined;
	QRScanner : undefined;
	Notification: undefined;
	EventRegistration : {eventId : string};
	EventCreation : undefined;
	AdminEventList: undefined;
  	AdminEventPanel: { eventId: string };
	EmployerEventList: undefined;
	EventListForRegistration : undefined;
	EmployerEventPanel: {eventId: string, companyId: string};
};


export type AuthStackParamList = {
	Login: undefined;
	Register: undefined;
	ForgetPassword: undefined;
};
