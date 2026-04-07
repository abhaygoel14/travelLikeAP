import React from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import galleryImages from "./galleryImage";

const galleryPosts = [
  { caption: "Sunset streets", location: "Bali", likes: "2.4k", comments: 68 },
  { caption: "Coffee and coast", location: "Goa", likes: "1.8k", comments: 44 },
  {
    caption: "Weekend escape",
    location: "Sikkim",
    likes: "3.1k",
    comments: 82,
  },
  {
    caption: "Hidden gem moments",
    location: "Kerala",
    likes: "2.2k",
    comments: 59,
  },
];

const MasonryImagesGallery = () => {
  return (
    <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 768: 2, 992: 4 }}>
      <Masonry gutter="1rem">
        {galleryImages.map((item, index) => {
          const post = galleryPosts[index % galleryPosts.length];

          return (
            <div
              className="gallery__item gallery__item--instagram"
              key={`${post.location}-${index}`}
            >
              <img
                className="masonry__img"
                src={item}
                alt={`${post.caption} in ${post.location}`}
              />

              <div className="gallery__overlay">
                <div className="gallery__overlay-top">
                  <span className="gallery__profile">
                    <i className="ri-instagram-line"></i>
                    @travel.like.ap
                  </span>
                  <span className="gallery__pill">{post.location}</span>
                </div>

                <div className="gallery__overlay-bottom">
                  <p>{post.caption}</p>
                  <div className="gallery__stats">
                    <span>
                      <i className="ri-heart-3-line"></i>
                      {post.likes}
                    </span>
                    <span>
                      <i className="ri-chat-3-line"></i>
                      {post.comments}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </Masonry>
    </ResponsiveMasonry>
  );
};

export default MasonryImagesGallery;
