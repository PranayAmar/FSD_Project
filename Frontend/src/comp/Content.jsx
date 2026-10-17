import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import VideoCallRoundedIcon from "@mui/icons-material/VideoCallRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";

const items = [
  {
    icon: <VideoCallRoundedIcon sx={{ color: "text.secondary" }} />,
    title: "Seamless Video Meetings",
    description:
      "Connect face-to-face with friends, family, and teammates through real-time video and audio communication.",
  },
  {
    icon: <LinkRoundedIcon sx={{ color: "text.secondary" }} />,
    title: "Easy Meeting Access",
    description:
      "Join meetings as a guest or access the application through your account for a simple and convenient experience.",
  },
  {
    icon: <DevicesRoundedIcon sx={{ color: "text.secondary" }} />,
    title: "Simple and Intuitive",
    description:
      "Enjoy a clean, responsive interface designed to make starting and joining video calls easy across devices.",
  },
  {
    icon: <GraphicEqRoundedIcon sx={{ color: "text.secondary" }} />,
    title: "Real-Time Communication",
    description:
      "Built with WebRTC and Socket.IO to support live audio, video, and real-time coordination between meeting participants.",
  },
];

export default function Content() {
  return (
    <Stack
      sx={{
        flexDirection: "column",
        alignSelf: "center",
        gap: 4,
        maxWidth: 450,
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          gap: 1.5,
          md: 2,
        }}
      >
        <Box
          component="img"
          src="/logo.svg"
          alt="Meetora logo"
          sx={{
            width: 48,
            height: 48,
            objectFit: "contain",
          }}
        />

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            letterSpacing: "-0.5px",
            color: "text.primary",
          }}
        >
          <span className="text-blue-500">Meet</span>ora
        </Typography>
      </Box>
      {items.map((item, index) => (
        <Stack key={index} direction="row" sx={{ gap: 2 }}>
          {item.icon}
          <div>
            <Typography gutterBottom sx={{ fontWeight: "medium" }}>
              {item.title}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {item.description}
            </Typography>
          </div>
        </Stack>
      ))}
    </Stack>
  );
}
