import { useState, useEffect } from "react";

const useDynamicTableHeight = (offset: number = 340) => {
    const [tableHeight, setTableHeight] = useState(window.innerHeight - offset);

    useEffect(() => {
        const handleResize = () => {
            setTableHeight(window.innerHeight - offset);
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [offset]);

    return tableHeight;
};

export default useDynamicTableHeight;