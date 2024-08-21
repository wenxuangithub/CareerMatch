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
};


export type AuthStackParamList = {
	Login: undefined;
	Register: undefined;
	ForgetPassword: undefined;
};
