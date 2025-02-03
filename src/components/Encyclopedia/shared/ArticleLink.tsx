import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ArticleLinkProps {
  articleId: string;
  children: React.ReactNode;
  className?: string;
}

const ArticleLink: React.FC<ArticleLinkProps> = ({ articleId, children, className = '' }) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Determine the category based on the articleId
    let category = 'politics'; // default
    
    // Map articleIds to their categories
    const categoryMap: { [key: string]: string } = {
      'alcor': 'politics',
      'terran-pandemic': 'culture',
      'gtv': 'technology',
      'stranis': 'species',
      'trtraris': 'species',
      'vada': 'species'
    };

    const targetCategory = categoryMap[articleId] || category;
    navigate(`/encyclopedia/${targetCategory}/${articleId}`);
  };

  return (
    <a
      href="#"
      onClick={handleClick}
      className={`text-blue-400 hover:text-blue-300 ${className}`}
    >
      {children}
    </a>
  );
};

export default ArticleLink;
