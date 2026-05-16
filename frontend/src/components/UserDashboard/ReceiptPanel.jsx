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
import { formatPrice } from "../../utils/tourSchema";

const ReceiptPanel = ({
  trips = [],
  onBack,
  onDownloadReceipt,
  brandLogo,
  brandName = "Travel Like AP",
}) => {
  const normalizedBrandName = String(brandName || "Travel Like AP");
  const hasApSuffix = /\bAP$/i.test(normalizedBrandName);

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
            <Typography fontWeight={800} color="#1c1917">
              {hasApSuffix ? (
                <>
                  {normalizedBrandName.replace(/\s*AP$/i, "").trimEnd()}{" "}
                  <Box component="span" sx={{ color: "var(--primary-color)" }}>
                    AP
                  </Box>
                </>
              ) : (
                normalizedBrandName
              )}
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
            const amountSpent = Number(
              trip?.amount || trip?.price || trip?.budget || 0,
            );
            const paymentState = String(
              trip?.paymentStatus || trip?.status || "Paid",
            ).toLowerCase();
            const badgeLabel =
              paymentState === "failure"
                ? "Failed"
                : paymentState === "pending"
                  ? "Pending"
                  : "Paid";
            const badgeStyles =
              paymentState === "failure"
                ? { bgcolor: "#fee2e2", color: "#b91c1c" }
                : paymentState === "pending"
                  ? { bgcolor: "#fef3c7", color: "#b45309" }
                  : { bgcolor: "#eff6ff", color: "#2563eb" };

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
                        label={badgeLabel}
                        sx={badgeStyles}
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
                        Amount spent: {formatPrice(amountSpent)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Payment done in INR. Download the receipt for the full
                        trip breakdown.
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
