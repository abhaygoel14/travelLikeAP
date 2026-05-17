import React, { useEffect, useMemo, useState } from "react";
import Slider from "react-slick";
import { get, ref } from "firebase/database";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { realtimeDb } from "../../utils/firebaseConfig";
import ava01 from "../../assets/images/ava-1.jpg";
import ava02 from "../../assets/images/ava-2.jpg";
import ava03 from "../../assets/images/ava-3.jpg";

const DEFAULT_TESTIMONIALS = [
  {
    id: "default-1",
    title: "Seamless travel experience",
    message:
      "Travel Like AP made every part of our trip effortless. The routes were beautiful and the support was excellent.",
    authorName: "Ayesha K.",
    authorAvatar: ava01,
  },
  {
    id: "default-2",
    title: "Memories that last",
    message:
      "We loved the attention to detail throughout the journey. It felt like a trip crafted just for us.",
    authorName: "Rahul S.",
    authorAvatar: ava02,
  },
  {
    id: "default-3",
    title: "A fan forever",
    message:
      "Every mile was worth it. I can’t wait to travel with Travel Like AP again.",
    authorName: "Nina P.",
    authorAvatar: ava03,
  },
];

const normalizeFanStories = (value = {}) =>
  Object.entries(value || {})
    .map(([id, entry]) => ({
      id: String(id),
      title: String(entry?.title || entry?.name || "Fan story").trim(),
      message: String(entry?.message || entry?.text || "").trim(),
      authorName: String(entry?.authorName || entry?.name || "Traveler").trim(),
      authorAvatar: String(entry?.authorAvatar || entry?.avatar || "").trim(),
      visible: entry?.visible === false ? false : true,
      createdAt: String(entry?.createdAt || "").trim(),
    }))
    .filter((story) => story.visible && story.message)
    .sort(
      (left, right) =>
        Date.parse(right.createdAt || "") - Date.parse(left.createdAt || ""),
    );

const Testimonials = () => {
  const [stories, setStories] = useState([]);
  const [viewingFanStory, setViewingFanStory] = useState(null);

  const storyItems = useMemo(
    () => (stories.length ? stories : DEFAULT_TESTIMONIALS),
    [stories],
  );

  const settings = useMemo(() => {
    const count = Math.max(1, storyItems.length);
    const slidesToShow = Math.min(3, count);
    return {
      dots: true,
      infinite: count > slidesToShow,
      autoplay: count > slidesToShow,
      speed: 1000,
      swipeToSlide: true,
      autoplaySpeed: 2000,
      slidesToShow,
      slidesToScroll: 1,
      adaptiveHeight: true,
      centerMode: false,
      rows: 1,
      responsive: [
        {
          breakpoint: 992,
          settings: {
            slidesToShow: Math.min(2, count),
            slidesToScroll: 1,
            infinite: count > 2,
            dots: true,
          },
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
            infinite: false,
            dots: true,
          },
        },
      ],
    };
  }, [storyItems.length]);

  useEffect(() => {
    let active = true;

    const loadStories = async () => {
      if (!realtimeDb) {
        return;
      }

      try {
        const snapshot = await get(ref(realtimeDb, "siteContent/fanStories"));
        if (!active) {
          return;
        }

        setStories(
          normalizeFanStories(snapshot.exists() ? snapshot.val() : {}),
        );
      } catch (error) {
        console.warn("Unable to load fan stories:", error);
      }
    };

    loadStories();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Slider {...settings}>
        {storyItems.map((item) => {
          return (
            <div key={item.id} className="testimonial py-4 px-3">
              <p
                className="testimonial__message"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.message}
              </p>
              <button
                type="button"
                className="testimonial__more"
                onClick={() => setViewingFanStory(item)}
              >
                Show More
              </button>

              <div className="d-flex align-items-center gap-4 mt-3">
                <img
                  src={item.authorAvatar || ava01}
                  className="w-25 h-25 rounded-2"
                  alt={item.authorName || "Story author"}
                />
                <div>
                  <h6 className="mb-0 mt-3">{item.authorName || "Traveler"}</h6>
                  <p>{item.title || "Fan story"}</p>
                </div>
              </div>
            </div>
          );
        })}
      </Slider>

      <Dialog
        open={Boolean(viewingFanStory)}
        onClose={() => setViewingFanStory(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: "1px solid #dbeafe",
          },
        }}
      >
        {viewingFanStory && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={viewingFanStory.authorAvatar}
                  alt={viewingFanStory.authorName}
                  sx={{
                    width: 52,
                    height: 52,
                    bgcolor: "#dbeafe",
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={800}
                    color="#1c1917"
                  >
                    {viewingFanStory.authorName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {viewingFanStory.createdAt
                      ? new Date(viewingFanStory.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "Recently shared"}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: "#dbeafe" }}>
              <Stack spacing={2}>
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="#1c1917"
                    sx={{ mb: 1 }}
                  >
                    {viewingFanStory.title || "Fan story"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.8 }}
                  >
                    {viewingFanStory.message}
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 2, py: 1.5 }}>
              <Button
                onClick={() => setViewingFanStory(null)}
                sx={{ color: "#2563eb" }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default Testimonials;
