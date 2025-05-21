export const askChat = async (entry) => {
    try {
        const response = await fetch(`/api/answer`,  {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(entry),
        })

        const data = await response.json();

        return data.data;

    } catch (error) {
        console.log(error)
    }
}