export const getRecords = async () => {
    try {
        const response = await fetch(`/api/records`);

        const data = await response.json();

        return data.data;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export const getRecord = async (id) => {
    try {
        const response = await fetch(`/api/records/${id}`);

        const data = await response.json();

        return data.data;
    } catch (error) {
        console.error(error);
    }
}

export const createRecord = async (entry) => {
    try {
        const response = await fetch(`/api/records`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(entry)
        });

        const data = await response.json();

        return data;
    } catch (error) {
        console.error(error);
    }
}

export const updateRecord = async (id, entry) => {
    try {
        delete entry._id;
        
        const response = await fetch(`/api/records/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(entry)
        });

        const data = await response.json();

        return data;
    } catch (error) {
        console.error(error);
    }
}

export const deleteRecord = async (id) => {
    try {
        const response = await fetch(`/api/records/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        return data.data;
    } catch (error) {
        console.error(error);
    }
}