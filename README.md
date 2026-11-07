# KKP Life Simulator - Thai Political System 2.0

**ระบบจำลองชีวิตและการเมืองไทย 2.0**

KKP Life Simulator เป็นเกมจำลองสถานการณ์ (Simulation Game) ที่ให้ผู้เล่นสวมบทบาทเป็นพลเมืองไทยที่ก้าวเข้าสู่เส้นทางการเมือง ตั้งแต่ระดับเริ่มต้นจนถึงตำแหน่งนายกรัฐมนตรี โดยตัวเกมถูกออกแบบมาให้สะท้อนกลไกการเมืองไทยภายใต้โครงสร้าง "3 ชั้น" (Layered System) ที่มีความสมจริงทั้งในด้านกฎหมาย การใช้อำนาจ และการบริหารประเทศ

---

## 🏛️ โครงสร้างการเล่น (The 3-Layer System)

ระบบการเล่นแบ่งออกเป็น 3 เลเยอร์หลักที่ส่งผลกระทบซึ่งกันและกัน:

1.  **Layer 01: กฎหมายและรัฐธรรมนูญ (Law & Constitution)**
    *   จำลองรัฐธรรมนูญฉบับปี 2560 (แก้ไขเพิ่มเติม) และฉบับปฏิรูป
    *   ระบบรัฐสภา: การเสนอกฎหมาย (พ.ร.บ.), การอภิปรายไม่ไว้วางใจ และการยุบสภา
    *   เกณฑ์คุณสมบัติทางการเมือง: อายุ, สังกัดพรรค และประสบการณ์

2.  **Layer 02: การใช้อำนาจและการเมือง (Power & Politics)**
    *   พรรคการเมือง 57 พรรค: จำลองอุดมการณ์ ขั้วอำนาจ และฐานเสียงภูมิภาค
    *   การเจรจาพรรคร่วมรัฐบาล: การจัดสรรโควตารัฐมนตรี 18 กระทรวงตามเสียงข้างมาก
    *   คะแนนนิยมและการตรวจสอบ: ดัชนีความเสี่ยงข่าวฉาว (Scandal Risk) และการเปิดไต่สวนสาธารณะโดย สตง./ป.ป.ช.

3.  **Layer 03: การบริหารและเศรษฐกิจ (Governance & Economy)**
    *   การจัดการงบประมาณ: ปรับสัดส่วนงบประมาณ 18 กระทรวง (วงเงิน 3 ล้านล้านบาท)
    *   ดัชนีชี้วัดจริง: GDP, อัตราเงินเฟ้อ, ความเชื่อมั่นผู้บริโภค และสัมประสิทธิ์ความเหลื่อมล้ำ (Gini Index)
    *   ความวุ่นวายรายภูมิภาค (Regional Chaos): จัดการความสงบใน 6 ภูมิภาคผ่านนโยบายและการตอบสนองต่อเหตุการณ์

---

## 🚀 ฟีเจอร์สำคัญ (Key Features)

*   **Weekly Turn-Based Strategy**: ระบบการเดินหมากแบบรายสัปดาห์ (4 สัปดาห์ = 1 เดือน) เพื่อความละเอียดในการตัดสินใจ
*   **Monthly Intelligence Report**: สรุปสถานการณ์การเมือง พาดหัวข่าวสำคัญ และกราฟแนวโน้มความวุ่นวายรายเดือน
*   **Branching Narratives**: เหตุการณ์สุ่ม (Narrative Events) ที่ต่อเนื่องตามการตัดสินใจก่อนหน้า (Story Chains)
*   **Strategic Map**: แผนที่ยุทธศาสตร์ กกต. 77 จังหวัด 6 ภูมิภาค พร้อมข้อมูลฐานเสียงและพรรคนำ
*   **Career Progression**: เส้นทางเติบโตจากประชาชน -> สมาชิกพรรค -> ส.ส. -> รัฐมนตรี -> นายกรัฐมนตรี
*   **Save/Load & Export**: ระบบจัดการเซฟเกมและส่งออกไฟล์ข้อมูล JSON

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

*   **Frontend**: React (TypeScript) + Vite
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **State Management**: React Hooks (useState/useEffect)
*   **Data Structure**: Modular TypeScript interfaces for complex simulation logic

---

## 📦 โครงสร้างไฟล์ (File Structure)

```text
/src
  /components     - UI Components (Map, Nav, Modals, CardTray)
  /engines        - Core Simulation Logic (Governance, Political, Legal, Achievement)
  /data           - Initial State, Card Lists, Region Specs, Narrative Events
  /types          - TypeScript Interfaces (GameState, PoliticalParty, etc.)
  /utils          - Helpers (Audio, Storage, Formatter)
/public/assets    - SVG Party Logos and Static Assets
```

---

## ⚙️ การเริ่มต้นพัฒนา (Getting Started)

1.  **ติดตั้ง Dependencies**:
    ```bash
    npm install
    ```

2.  **รัน Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build สำหรับ Production**:
    ```bash
    npm run build
    ```

---

## 📜 เงื่อนไขตามรัฐธรรมนูญ (Constitutional Rules)
ตัวเกมจำลองมาตราที่สำคัญ เช่น:
*   **มาตรา 103**: การยุบสภาและการจัดเลือกตั้งภายใน 45-60 วัน
*   **มาตรา 158**: วาระการดำรงตำแหน่งนายกรัฐมนตรีรวมกันไม่เกิน 8 ปี
*   **มาตรา 160**: คุณสมบัติและลักษณะต้องห้ามของรัฐมนตรี

---
*จัดทำขึ้นเพื่อการจำลองระบบการเมืองและพัฒนาทักษะการตัดสินใจเชิงยุทธศาสตร์*
