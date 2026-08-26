import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import  amico  from '../img/amico.png';
import '../css/Startingpage.css';

export const Startingpage = () => {
  return (
    <div className="container-fluid start-page d-flex flex-column">
      {/* Navbar */}
      <nav className="navbar auth-nav px-3 px-sm-4 flex-nowrap">
        <p className="mb-0">PresentSir</p>
        <div className="auth-nav-actions">
          <Link to='/Login'><button className="btn btn-light border">Login</button></Link>
          <Link to='/Register'><button className="btn button-color">Register</button></Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container d-flex flex-grow-1 align-items-center justify-content-center py-4">
        <div className="row w-100 start-hero g-4">
          {/* Left Section */}
          <div className="col-12 col-md-6 d-flex flex-column justify-content-center start-hero-copy">
            <h1 className="fw-bold">
              <span className="text-color pb-3">Presentsir:</span> <br /> Smart Attendance for Hassle-Free Mentoring.
            </h1>
            <Link to='/Register'><button className="btn button-color mt-3 start-cta">Register Now</button></Link>
          </div>

          {/* Right Section */}
          <div className="col-12 col-md-6 text-center start-art">
            <img
              src={amico}
              alt="Illustration"
              className="img-fluid"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Startingpage;