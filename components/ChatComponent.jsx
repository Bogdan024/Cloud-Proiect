import React, { useState } from 'react'
import { askChat } from '../utils/chatFunctions';
import MessageBox from './MessageBox';

const ChatComponent = () => {
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);

    const handleKeyDown = async (e) => {
        if(e.key !== 'Enter' || userInput.length === 0) return;

        const currentMessages = {
            role: 'user',
            content: userInput
        }

        const currentChatHistory = [...chatMessages, currentMessages];
        
        setChatMessages(currentChatHistory);

        try {
            setIsLoading(true);

            const response = await askChat({ type: 'user', messages: currentChatHistory});

            setUserInput('');
            setIsLoading(false);

            setChatMessages([...currentChatHistory, response.message])
        } catch (error) {
            console.log(error);
        }
    }

	return (
		<div className={"w-full max-w-[1500px] mx-auto my-10"}>
			<div className={"border border-b-0 rounded-lg border-gray-300'"}>
				<div className={'border-b text-center px-[20px] py-[10px]'}>
					<span className={'text-md font-bold text-gray-900'}>
						This a chat component that looks like Yahoo!
					</span>
				</div>
				<MessageBox chatMessages={chatMessages}/>
			</div>
			<input
				id={'chat-input'}
				type={'text'}
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                disabled={isLoading}
				className="bg-gray-50 border border-gray-300 border-x-0 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-4"
				placeholder="Type something..."
				onKeyDown={handleKeyDown}
			/>
		</div>
	);
}

export default ChatComponent