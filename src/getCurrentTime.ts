export const getCurrentTime = () => {
	return new Intl.DateTimeFormat('hu-HU', {
		timeZone: 'Europe/Budapest',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).format(new Date());
};
