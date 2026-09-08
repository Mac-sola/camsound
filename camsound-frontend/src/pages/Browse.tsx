import React from 'react';
import { Link } from 'react-router-dom';
import FanBrowse from '../components/FanBrowse';
import { PlayerBar } from '../components/Layout';
import SongPlayerModal from '../components/SongPlayerModal';

const Browse: React.FC = () => (
  <div className="public-browse-page">
    <nav className="navbar-camsound public-browse-nav">
      <div className="container">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand"><i className="fas fa-drum" /> CamSound</Link>
          <div className="public-browse-links">
            <Link to="/">Home</Link>
            <Link to="/browse" className="active">Browse</Link>
            <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </nav>

    <header className="public-browse-hero">
      <div className="container">
        <h1>Discover Cameroonian Magic</h1>
        <p>Explore the best Makossa, Bikutsi, Afrobeat, and more.</p>
      </div>
    </header>

    <main className="container public-browse-content">
      <FanBrowse />
    </main>

    <PlayerBar />
    <SongPlayerModal />
  </div>
);

export default Browse;
