import openai from "../../../lib/openai";
import { sendBadRequest, sendMethodNotAllowed, sendOk } from "../../../utils/apiMethods";
import { MAX_MEMORY } from "../../../utils/constants";

const SYSTEM_PROMPTS = {
    SIMPLE_ASSISTANT: {
        MESSAGE: {
            'role': 'system',
            'content': 'You are a simple assistant. You respond with simple sentences.',
        },
        TEMPERATURE: 1,
        MAX_TOKENS: 50,
        TYPE: 'simple_assistant',

    },
    USER: {
        MESSAGE: {
			'role': 'user',
			'content': 'You are a user. You respond with normal sentences.',
		},
        TEMPERATURE: 1,
        MAX_TOKENS: 50,
        TYPE: 'user',

    }

    
}

const ERRORS = {
	DATABASE_ERROR: {
		type: 'database_error',
		message: 'Error while processing the request.',
	},
	WRONG_CONVERSATION_TYPE: {
		type: 'wrong_conversation_type',
		message: 'The conversation type is not known.',
	},
	OPEN_AI_ERROR: {
		type: 'open_ai_error',
		message: 'Error while processing the request.',
	},
};

const chatCompletion = async (messages, maxTokens, temperature) => {
    const rawResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature,
    })

    return rawResponse?.choices[0];
}

const converseChat = async (res, messages, role) => {
    try {
        let newMessages = [];

        if (messages.length > MAX_MEMORY) {
            newMessages = messages.slice(-MAX_MEMORY);
        } else {
            newMessages = messages;
        }

        const messageArr = [
            role.MESSAGE,
            ...newMessages,
        ]

        const response = await chatCompletion(messageArr, role.MAX_TOKENS, role.TEMPERATURE);

        return sendOk(res, response);

    } catch (error) {
        console.log(error)
    }
}

const converse = (res, messages, type) => {
	switch (type) {
		case SYSTEM_PROMPTS.SIMPLE_ASSISTANT.TYPE:
			return converseChat(res, messages, SYSTEM_PROMPTS.SIMPLE_ASSISTANT);
		case SYSTEM_PROMPTS.USER.TYPE:
			return converseChat(res, messages, SYSTEM_PROMPTS.USER);
		default:
			return sendBadRequest(res, 'wrong_conversation_type');
	}
}

export default async function handler(req, res) {
    const { method, body } = req;

    const isAllowedMethod = method === "POST";

    if (!isAllowedMethod) {
        return sendMethodNotAllowed(res, "Method not allowed!");
    }

    const { messages, type } = body;

    if (!messages || !type) {
        return sendBadRequest(res, "Bad request!");
    }

    try {
        return converse(res, messages, type);
    } catch (error) {
        console.log(error);
    }
  }