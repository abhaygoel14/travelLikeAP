import Tour from "../models/Tour.js";

//Create new tour
export const createTour = async (req, res) => {
  const newTour = new Tour(req.body);

  try {
    const savedTour = await newTour.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Successfully created",
        data: savedTour,
      });
  } catch (error) {
    res
      .status(500)
      .json({ success: true, message: "Failed to create. Try again!" });
  }
};

//Update Tour
export const updateTour = async (req, res) => {
  const id = req.params.id;

  try {
    const updatedTour = await Tour.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      { new: true },
    );

    res
      .status(200)
      .json({
        success: true,
        message: "Successfully updated",
        data: updatedTour,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

//Delete Tour
export const deleteTour = async (req, res) => {
  const id = req.params.id;

  try {
    await Tour.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Successfully deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete" });
  }
};

//Getsingle Tour
export const getSingleTour = async (req, res) => {
  const id = req.params.id;

  try {
    const tour = await Tour.findById(id).populate("reviews");

    res
      .status(200)
      .json({ success: true, message: "Successfully", data: tour });
  } catch (error) {
    res.status(404).json({ success: false, message: "Not Found" });
  }
};

//Get All Tour
export const getAllTour = async (req, res) => {
  //For pagination
  const page = parseInt(req.query.page);

  //console.log(page)

  try {
    const tours = await Tour.find({})
      .populate("reviews")
      .skip(page * 8)
      .limit(8);

    res
      .status(200)
      .json({
        success: true,
        count: tours.length,
        message: "Successfully",
        data: tours,
      });
  } catch (error) {
    res.status(404).json({ success: false, message: "Not Found" });
  }
};

// Get tour by search
export const getTourBySearch = async (req, res) => {
  const {
    city = "",
    distance = "",
    maxGroupSize = "",
    startDate = "",
    endDate = "",
  } = req.query;
  const query = {};

  if (String(city).trim()) {
    query.city = new RegExp(String(city).trim(), "i");
  }

  const parsedDistance = parseInt(distance);
  if (!Number.isNaN(parsedDistance)) {
    query.distance = { $gte: parsedDistance };
  }

  const parsedMaxGroupSize = parseInt(maxGroupSize);
  if (!Number.isNaN(parsedMaxGroupSize)) {
    query.maxGroupSize = { $gte: parsedMaxGroupSize };
  }

  if (startDate) {
    query.startDate = { ...(query.startDate || {}), $gte: new Date(startDate) };
  }

  if (endDate) {
    query.endDate = { ...(query.endDate || {}), $lte: new Date(endDate) };
  }

  try {
    const tours = await Tour.find(query).populate("reviews");

    res
      .status(200)
      .json({ success: true, message: "Successfully", data: tours });
  } catch (error) {
    res.status(404).json({ success: false, message: "Not Found" });
  }
};

//Get featured Tour
export const getFeaturedTour = async (req, res) => {
  //console.log(page)

  try {
    const tours = await Tour.find({ featured: true })
      .populate("reviews")
      .limit(8);

    res
      .status(200)
      .json({ success: true, message: "Successfully", data: tours });
  } catch (error) {
    res.status(404).json({ success: false, message: "Not Found" });
  }
};

//Get tour count
export const getTourCount = async (req, res) => {
  try {
    const tourCount = await Tour.estimatedDocumentCount();

    res.status(200).json({ success: true, data: tourCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch" });
  }
};
