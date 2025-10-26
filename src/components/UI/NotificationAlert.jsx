// NotificationAlert.jsx
import React from "react";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NotificationAlert = ({ type, message, timeout }) => {
    // trigger the toast based on type
    React.useEffect(() => {
        if (!message) return;

        const options = {
            position: "top-right",
            autoClose: timeout,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            transition: Slide,
        };

        switch (type.toLowerCase()) {
            case "success":
                toast.success(message, options);
                break;
            case "error":
                toast.error(message, options);
                break;
            case "warning":
                toast.warn(message, options);
                break;
            default:
                toast.info(message, options);
        }
    }, [type, message, timeout]);

    return <ToastContainer />;
};

export default NotificationAlert;


// Usage :
//  <NotificationAlert
//        type=<info,success, warning, error>
//         message=<String>
//         timeout=<integers (ms)>
//   />
