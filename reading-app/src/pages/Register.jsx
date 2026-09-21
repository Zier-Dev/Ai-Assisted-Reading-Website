import { useState } from "react";
import "../style/Register.css";


function Register() {
    const [name, setName] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Student");
    const [error, setError] = useState("");
    

    async function handleRegister(event){
        event.preventDefault();
        setError("");

        const response = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify({
                user: name,
                full_name: fullName,
                password: password,
                role: role
            })
        });

        const data = await response.json();


    }


    return(
        <div className = "register-box">
            <form onSubmit = {handleRegister}>
                <label> Username:
                    <input type = "text" placeholder = "Name" value = {name} onChange = {(event) => setName(event.target.value)}></input>
                </label>
                <label> Full Name:
                    <input type = "text" placeholder = "Full Name"  value = {fullName} onChange = {(event) => setFullName(event.target.value)}></input>
                </label>
                <label> Passsword:
                    <input type = "password" placeholder = "Password"  value = {password} onChange = {(event) => setPassword(event.target.value)}></input>
                </label>
                <p>Role: Student</p>

                <button className="submit_btn" type = "submit">Submit</button>
            </form>
        </div>
    )
}

export default Register;