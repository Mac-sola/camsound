import React from 'react';

const FanHome: React.FC = () => {
  // Placeholder data; replace with real API calls later
  const newReleases = [
    { id: 1, title: 'Song A', artist: 'Artist X' },
    { id: 2, title: 'Song B', artist: 'Artist Y' },
    { id: 3, title: 'Song C', artist: 'Artist Z' },
  ];
  const trendingSongs = [
    { id: 4, title: 'Hit 1', artist: 'Artist M' },
    { id: 5, title: 'Hit 2', artist: 'Artist N' },
    { id: 6, title: 'Hit 3', artist: 'Artist O' },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Welcome back!</h2>
      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-2">New Releases</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {newReleases.map((track) => (
            <div key={track.id} className="p-4 bg-var(--bg-secondary) rounded-lg shadow-sm">
              <p className="font-medium">{track.title}</p>
              <p className="text-sm text-muted">{track.artist}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-xl font-semibold mb-2">Trending Songs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trendingSongs.map((track) => (
            <div key={track.id} className="p-4 bg-var(--bg-secondary) rounded-lg shadow-sm">
              <p className="font-medium">{track.title}</p>
              <p className="text-sm text-muted">{track.artist}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FanHome;
