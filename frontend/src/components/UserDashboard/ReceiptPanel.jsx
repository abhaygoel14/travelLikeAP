import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import CreditCardIcon from "@mui/icons-material/CreditCard";

const ReceiptPanel = ({
  trips = [],
  onBack,
  onDownloadReceipt,
  brandLogo,
  brandName = "Travel like AP",
}) => {
  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.25}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} color="#1c1917">
            Receipts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check your trip spend and download a clean branded receipt.
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          useFlexGap
          flexWrap="wrap"
        >
          <Stack direction="row" spacing={0.8} alignItems="center">
            <Avatar
              src={brandLogo || ""}
              alt={brandName}
              variant="rounded"
              sx={{ width: 34, height: 34, bgcolor: "#dbeafe" }}
            />
            <Typography fontWeight={800} color="#2563eb">
              {brandName}
            </Typography>
          </Stack>
          <Button
            size="small"
            disableRipple
            onClick={onBack}
            sx={{
              borderRadius: 1.5,
              textTransform: "none",
              color: "#2563eb",
              transition: "none",
              "&:hover": {
                backgroundColor: "transparent",
                color: "#2563eb",
              },
            }}
          >
            Back to dashboard
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        {trips.length ? (
          trips.map((trip, index) => {
            const amountSpent = Number(trip?.price || trip?.budget || 0);

            return (
              <Grid item xs={12} md={6} key={`${trip.title}-${index}-receipt`}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    boxShadow: "none",
                    border: "1px solid #dbeafe",
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1}
                    >
                      <Box>
                        <Typography fontWeight={800} color="#1c1917">
                          {trip.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Receipt #{String(index + 1).padStart(3, "0")} •{" "}
                          {trip.date || "Upcoming"}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        icon={<CreditCardIcon sx={{ fontSize: 16 }} />}
                        label="Paid"
                        sx={{ bgcolor: "#eff6ff", color: "#2563eb" }}
                      />
                    </Stack>

                    <Stack spacing={0.55} sx={{ mt: 1.25 }}>
                      <Typography variant="body2" color="text.secondary">
                        Destination:{" "}
                        {trip.city ||
                          trip?.relatedTour?.city ||
                          "Travel destination"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duration: {trip.status || "Custom plan"}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="#1c1917"
                        fontWeight={700}
                      >
                        Amount spent: ${amountSpent}
                      </Typography>
                    </Stack>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={0.75}
                      useFlexGap
                      flexWrap="wrap"
                      sx={{ mt: 1.5 }}
                    >
                      <Button
                        size="small"
                        disableRipple
                        component={RouterLink}
                        to={trip.route || "/tours"}
                        sx={{
                          borderRadius: 1.5,
                          textTransform: "none",
                          color: "#2563eb",
                          transition: "none",
                          "&:hover": {
                            backgroundColor: "transparent",
                            color: "#2563eb",
                          },
                        }}
                      >
                        View trip
                      </Button>
                      <Button
                        size="small"
                        disableRipple
                        disableElevation
                        variant="contained"
                        startIcon={<DownloadRoundedIcon fontSize="small" />}
                        onClick={() => onDownloadReceipt?.(trip, index)}
                        sx={{
                          borderRadius: 1.5,
                          textTransform: "none",
                          bgcolor: "#2563eb",
                          color: "#fff",
                          boxShadow: "none",
                          transition: "none",
                          "&:hover": {
                            bgcolor: "#2563eb",
                            boxShadow: "none",
                          },
                        }}
                      >
                        Download
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "none",
                border: "1px dashed #bfdbfe",
                bgcolor: "#f8fbff",
              }}
            >
              <CardContent>
                <Typography fontWeight={800} color="#1c1917">
                  No receipts yet
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Your trip receipts will appear here once bookings are added.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ReceiptPanel;
