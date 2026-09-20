import { useState } from "react";

function Register() {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    return(
        <div>hello</div>
    )
}

export default Register;