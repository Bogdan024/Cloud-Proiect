import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { defaultRecordValues } from "../../../utils/constants";
import { getRecord, updateRecord } from "../../../utils/recordsFunctions";
import Spinner from "../../../components/Spinner";
import RecordForm from "../../../components/RecordForm";

const EditRecord = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [entry, setEntry] = useState(defaultRecordValues);

    const handleGetRecord = async (id) => {
        try {
            const response = await getRecord(id);

            console.log(response);

            if(response) {
                setEntry(response);
                setIsLoading(false);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const onSubmit = async (data) => {
        try {
            const response = await updateRecord(entry._id, data);

            if (response) {
                router.push('/records');
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        const id = router.query.id;

        if(!id) {
            router.push('/records');
            return;
        }

        handleGetRecord(id);
    }, []);

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <RecordForm onSubmit={onSubmit} entry={entry} />
    )
}

export default EditRecord;