import UserAgent from 'user-agents';

export default function generateRandomUserAgent() {
	return new UserAgent().toString();
}
