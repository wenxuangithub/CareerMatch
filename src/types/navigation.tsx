type EventData = {
	key : string
	eventName: string;
	eventDescription: string;
	eventImageURL: string;
	eventURL: string;
	eventDateTime: number;
	userId: string;
  };

export type MainStackParamList = {
	MainTabs: undefined;
	SecondScreen: {
		data: undefined;
	};
	GenerateQR: undefined;
	QRScan: undefined;
	EditUserProfile: undefined;
	Search:undefined;
	Scanner:undefined;
	CreateEvent:undefined;
	EventDetails: {
		data : EventData;
		userId : string;
	}
	AdminEventDetails: {
		userId : string;
		data : EventData;
	}
	Home : undefined;
	ChatBot : undefined;
};


export type AuthStackParamList = {
	Login: undefined;
	Register: undefined;
	ForgetPassword: undefined;
};

export type MainTabsParamList = {
	Home: undefined;
	Profile: undefined;
	About: undefined;
};
