import React from 'react';
import { Link } from 'react-router-dom';
import { AtlasCharacter } from '../atlas/AtlasCharacter';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-bg-base border-t border-border py-12 px-4 sm:px-6 lg:px-8 mt-auto relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center space-y-8 md:space-y-0">
        
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-3">
            <div className="text-xl tracking-tight">
              <span className="font-bold text-text-primary">Guess</span>
              <span className="font-bold text-accent-cyan">My</span>
              <span className="font-bold text-text-primary">Place</span>
            </div>
          </div>
          <div className="flex space-x-6 text-sm text-text-secondary">
            <Link to="/game" className="hover:text-text-primary transition-colors">Play</Link>
            <Link to="/docs" className="hover:text-text-primary transition-colors">Docs</Link>
            <Link to="/roadmap" className="hover:text-text-primary transition-colors">Roadmap</Link>
            <Link to="/admin" className="hover:text-text-primary transition-colors">Admin</Link>
            <a href="https://github.com/rafsan1711/geoai" target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors">GitHub</a>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Built with Atlas GMP Engine v2.0.0 &middot; Open source &middot; GPL-3.0
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-text-primary">Atlas Engine</p>
            <p className="text-xs font-mono text-text-muted">Status: Active</p>
          </div>
          <AtlasCharacter size="sm" showLabel={false} animate={false} />
        </div>
      </div>
    </footer>
  );
};
