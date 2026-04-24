import React, { useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, TextField } from '@mui/material';




function HomeComponent() {


  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");


  let handleJoinVideoCall = async () => {
    if (meetingCode.trim()) navigate(`/${meetingCode}`);
  }

  let handleKeyDown = (e) => {
    if (e.key === "Enter") handleJoinVideoCall();
  }

  return (
    <>

      <div className="navBar">
        <h2 className="logo">MeetHub</h2>

        <Button
          variant="outlined"
          color="error"
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/auth");
          }}
        >
          Logout
        </Button>
      </div>



      <div className="meetContainer">
        <div className="leftPanel">
          <h1>Quality Video Calls</h1>
          <p>
            Simple, fast and secure video meetings for everyone.
          </p>

          <div className="joinCard">
            <TextField
              fullWidth
              label="Enter Meeting Code"
              value={meetingCode}
              onChange={e => setMeetingCode(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <Button
              fullWidth
              size="large"
              variant="contained"
              onClick={handleJoinVideoCall}
            >
              Join Meeting
            </Button>
          </div>
        </div>

        <div className="rightPanel">
          <img src="/logo3.png" alt="video call" />
        </div>
      </div>

    </>
  )
}


export default withAuth(HomeComponent)