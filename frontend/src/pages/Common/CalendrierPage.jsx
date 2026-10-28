import React from "react";
import SortieCalendar from "../../components/Sortie/SortieCalendar";

// En-tête (titre, mois affiché, navigation) et légende vivent dans
// SortieCalendar : ils dépendent du mois courant, qui est son état local.
const CalendrierPage = () => <SortieCalendar />;

export default CalendrierPage;
