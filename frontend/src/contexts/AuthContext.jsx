import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAPIBaseURL } from "../utils/apiConfig.js";

export const AuthContext = createContext({});

// Dynamic API URL for network access
const API_URL = getAPIBaseURL();

const client = axios.create({
    baseURL: API_URL
})


export const AuthProvider = ({ children }) => {

    const authContext = useContext(AuthContext);


    const [userData, setUserData] = useState(authContext);


    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password
            })

            if (request.status === httpStatus.CREATED) {
                return request?.data?.message || "User Registered Successfully";
            }
            return "Registration successful";
        } catch (err) {
            const errorMessage = err?.response?.data?.message || err?.message || "Registration failed";
            throw new Error(errorMessage);
        }
    }

    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            });

            if (request && request.status === httpStatus.OK && request?.data?.token) {
                localStorage.setItem("token", request.data.token);
                router("/home");
                return { success: true, message: "Login successful" };
            }
            return { success: false, message: "Login failed" };
        } catch (err) {
            const errorMessage = err?.response?.data?.message || err?.message || "Login failed. Please try again.";
            throw new Error(errorMessage);
        }
    }


    const data = {
        userData, setUserData, handleRegister, handleLogin
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )

}