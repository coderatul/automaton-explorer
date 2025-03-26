
import React from 'react';
import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full py-3 border-t bg-background text-muted-foreground">
      <div className="container flex items-center justify-center gap-2 text-sm">
        <span>Created by</span>
        <a 
          href="https://github.com/coderatul" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors"
          aria-label="coderatul's GitHub profile"
        >
          <Github size={14} aria-hidden="true" />
          <span>coderatul</span>
        </a>
      </div>
    </footer>
  );
}
