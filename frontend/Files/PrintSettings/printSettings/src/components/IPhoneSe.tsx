import Vector from "./assets/Vector";
import Line from "./assets/Line";
import Arrow from "./assets/Arrow";
import "./IPhoneSe.css";

export default function IPhoneSe({ className = "" }: IPhoneSeProps) {
  return (
    <div className={`${className} i-phone-se-i-phone-se`}>
      <div className="i-phone-se-hydroprint">
        <span>
          <span className="i-phone-se-text">Hydro</span>
          <span className="i-phone-se-text-1">print</span>
        </span>
      </div>
      <div className="i-phone-se-rectangle">
        <div className="i-phone-se-printer">Printer</div>
        <div className="i-phone-se-tt-vector-nus_printer_ea">
          <div className="i-phone-se-t-vector">
            <Vector className="i-phone-se-vector" />
          </div>
          <div>NUS_Printer_EA</div>
        </div>
      </div>
      <div className="i-phone-se-rectangle-1">
        <div className="i-phone-se-nu-s_nuh_printer">NUS_NUH_Printer</div>
        <div className="i-phone-se-tt-line-11nus_bio_printer-tline-11ntu_printer-tline-11find-more-printers" >
          <div className="i-phone-se-t-line-11nus_bio_printer">
            <Line className="i-phone-se-line" />
            <div className="i-phone-se-nu-s_bio_printer">
              NUS_Bio_Printer
            </div>
          </div>
          <div className="i-phone-se-t-line-11ntu_printer">
            <Line className="i-phone-se-line-1" />
            <div className="i-phone-se-nt-u_printer">NTU_Printer</div>
          </div>
          <div className="i-phone-se-t-line-11find-more-printers">
            <Line className="i-phone-se-line-2" />
            <div className="i-phone-se-find-more-printers">
              <p>Find More Printers...</p>
            </div>
          </div>
        </div>
      </div>
      <div className="i-phone-se-t-arrow">
        <Arrow className="i-phone-se-arrow" />
      </div>
      <div className="i-phone-se-other-printers">Other Printers</div>
    </div>
  );
}

interface IPhoneSeProps {
  className?: string;
}
