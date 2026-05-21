import BodyweightCheckInCard from "./BodyweightCheckInCard.jsx";
import BottomSheet from "../ui/BottomSheet.jsx";

const BodyweightEntryModal = ({ open, currentBodyweight, unit, onClose, onSave }) => (
  <BottomSheet open={open} title="Add Bodyweight" onClose={onClose}>
    <BodyweightCheckInCard currentBodyweight={currentBodyweight} unit={unit} onSave={onSave} />
  </BottomSheet>
);

export default BodyweightEntryModal;
