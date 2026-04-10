import React, { useEffect, useState } from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { get as getDbValue, ref as dbRef } from "firebase/database";
import { realtimeDb } from "../../utils/firebaseConfig";
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

const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/travellikeap/";

const fallbackGalleryEntries = galleryImages.map((image, index) => {
  const post = galleryPosts[index % galleryPosts.length];

  return {
    id: `default-gallery-${index}`,
    image,
    caption: post.caption,
    location: post.location,
    likes: post.likes,
    comments: String(post.comments),
  };
});

const normalizeGalleryEntries = (items = []) => {
  const source = Array.isArray(items) ? items : Object.values(items || {});

  return source
    .map((item, index) => {
      const fallbackPost = galleryPosts[index % galleryPosts.length];

      return {
        id: String(item?.id || `gallery-${index}`),
        image: String(
          item?.image ||
            item?.src ||
            item?.photo ||
            fallbackGalleryEntries[index]?.image ||
            "",
        ).trim(),
        caption: String(
          item?.caption || item?.comment || fallbackPost.caption || "",
        ).trim(),
        location: String(
          item?.location || item?.place || fallbackPost.location || "",
        ).trim(),
        likes: String(item?.likes || fallbackPost.likes || "").trim(),
        comments: String(item?.comments || fallbackPost.comments || "").trim(),
      };
    })
    .filter((item) => item.image);
};

const MasonryImagesGallery = () => {
  const [galleryEntries, setGalleryEntries] = useState(fallbackGalleryEntries);

  useEffect(() => {
    let active = true;

    const loadHomeGallery = async () => {
      if (!realtimeDb) {
        return;
      }

      try {
        const snapshot = await getDbValue(
          dbRef(realtimeDb, "siteContent/homeGallery"),
        );

        if (!active || !snapshot.exists()) {
          return;
        }

        const nextEntries = normalizeGalleryEntries(snapshot.val());

        if (nextEntries.length) {
          setGalleryEntries(nextEntries);
        }
      } catch (error) {
        console.warn("Unable to load homepage gallery:", error);
      }
    };

    loadHomeGallery();

    return () => {
      active = false;
    };
  }, []);
  return (
    <ResponsiveMasonry columnsCountBreakPoints={{ 0: 2, 768: 2, 992: 4 }}>
      <Masonry gutter="0.75rem">
        {galleryEntries.map((entry, index) => {
          const safeCaption = entry.caption || `Travel moment ${index + 1}`;
          const safeLocation = entry.location || "Destination";

          return (
            <div
              className="gallery__item gallery__item--instagram"
              key={`${entry.id}-${index}`}
            >
              <img
                className="masonry__img"
                src={entry.image}
                alt={`${safeCaption} in ${safeLocation}`}
              />

              <div className="gallery__overlay">
                <div className="gallery__overlay-top">
                  <a
                    className="gallery__profile gallery__profile--link"
                    href={INSTAGRAM_PROFILE_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open @travellikeap on Instagram`}
                    title="Open Instagram"
                  >
                    <i className="ri-instagram-line"></i>
                    @travellikeap
                  </a>
                  <span className="gallery__pill">{safeLocation}</span>
                </div>

                <div className="gallery__overlay-bottom">
                  <p>{safeCaption}</p>
                  <div className="gallery__stats">
                    <span>
                      <i className="ri-heart-3-line"></i>
                      {entry.likes || "0"}
                    </span>
                    <span>
                      <i className="ri-chat-3-line"></i>
                      {entry.comments || "0"}
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
