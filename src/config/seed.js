/**
 * Database Seed Script
 * Populates the PostgreSQL database with initial data
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import db, { initDatabase } from './database.js';

dotenv.config();

const runSeed = async () => {
  console.log('🌱 Starting PostgreSQL database seeding...');
  
  try {
    await initDatabase();

    // Seed Users
    const seedUsers = async () => {
      const adminPassword = bcrypt.hashSync('admin123', 10);
      const userPassword = bcrypt.hashSync('user123', 10);

      await db.query(`
        INSERT INTO users (id, email, password, username, role, age, gender)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, ['1', 'admin@sidirok.com', adminPassword, 'Admin SI-DIROK', 'admin', 35, 'male']);
      
      await db.query(`
        INSERT INTO users (id, email, password, username, role, age, gender)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, ['2', 'user@test.com', userPassword, 'Test User', 'user', 30, 'male']);

      console.log('✅ Users seeded');
    };

    // Seed Symptoms
    const seedSymptoms = async () => {
      const symptoms = [
        { id: 'G01', code: 'G01', name: 'Batuk berkepanjangan lebih dari 3 minggu', description: 'Batuk terus menerus yang tidak kunjung sembuh selama lebih dari 3 minggu', category: 'respiratory', mb: 0.8, md: 0.1 },
        { id: 'G02', code: 'G02', name: 'Batuk berdarah (hemoptisis)', description: 'Mengeluarkan darah saat batuk', category: 'respiratory', mb: 0.9, md: 0.05 },
        { id: 'G03', code: 'G03', name: 'Sesak napas (dispnea)', description: 'Kesulitan bernapas atau napas terasa berat', category: 'respiratory', mb: 0.85, md: 0.1 },
        { id: 'G04', code: 'G04', name: 'Mengi (wheezing)', description: 'Suara siulan saat bernapas', category: 'respiratory', mb: 0.75, md: 0.15 },
        { id: 'G05', code: 'G05', name: 'Produksi dahak berlebihan', description: 'Mengeluarkan lendir dalam jumlah banyak', category: 'respiratory', mb: 0.7, md: 0.15 },
        { id: 'G06', code: 'G06', name: 'Nyeri dada persisten', description: 'Rasa sakit di area dada yang terus menerus', category: 'pain', mb: 0.85, md: 0.1 },
        { id: 'G07', code: 'G07', name: 'Nyeri dada menjalar ke lengan kiri', description: 'Nyeri dada yang menyebar ke lengan kiri', category: 'pain', mb: 0.95, md: 0.02 },
        { id: 'G08', code: 'G08', name: 'Sakit tenggorokan kronis', description: 'Rasa sakit di tenggorokan yang berlangsung lama', category: 'pain', mb: 0.8, md: 0.1 },
        { id: 'G09', code: 'G09', name: 'Nyeri saat menelan (odinofagia)', description: 'Rasa sakit saat menelan makanan', category: 'pain', mb: 0.85, md: 0.08 },
        { id: 'G10', code: 'G10', name: 'Sakit kepala parah tiba-tiba', description: 'Sakit kepala hebat yang muncul mendadak', category: 'pain', mb: 0.9, md: 0.05 },
        { id: 'G11', code: 'G11', name: 'Penurunan berat badan drastis', description: 'Kehilangan berat badan signifikan tanpa diet', category: 'systemic', mb: 0.85, md: 0.1 },
        { id: 'G12', code: 'G12', name: 'Kelelahan ekstrem', description: 'Rasa lelah yang sangat berat', category: 'systemic', mb: 0.7, md: 0.2 },
        { id: 'G13', code: 'G13', name: 'Demam tidak dapat dijelaskan', description: 'Suhu tubuh tinggi tanpa penyebab jelas', category: 'systemic', mb: 0.65, md: 0.2 },
        { id: 'G14', code: 'G14', name: 'Keringat malam berlebihan', description: 'Berkeringat sangat banyak saat tidur malam', category: 'systemic', mb: 0.7, md: 0.15 },
        { id: 'G15', code: 'G15', name: 'Kehilangan nafsu makan', description: 'Tidak merasa lapar atau tidak tertarik makan', category: 'systemic', mb: 0.65, md: 0.2 },
        { id: 'G16', code: 'G16', name: 'Jantung berdebar (palpitasi)', description: 'Detak jantung terasa cepat atau tidak teratur', category: 'cardiovascular', mb: 0.8, md: 0.1 },
        { id: 'G17', code: 'G17', name: 'Pembengkakan kaki', description: 'Kaki membengkak karena penumpukan cairan', category: 'cardiovascular', mb: 0.75, md: 0.15 },
        { id: 'G18', code: 'G18', name: 'Keringat dingin', description: 'Berkeringat dengan sensasi dingin', category: 'cardiovascular', mb: 0.85, md: 0.1 },
        { id: 'G19', code: 'G19', name: 'Mual dan muntah', description: 'Perasaan mual yang dapat disertai muntah', category: 'cardiovascular', mb: 0.6, md: 0.25 },
        { id: 'G20', code: 'G20', name: 'Kelemahan pada wajah/lengan/kaki', description: 'Salah satu sisi tubuh terasa lemah', category: 'neurological', mb: 0.95, md: 0.02 },
        { id: 'G21', code: 'G21', name: 'Kesulitan berbicara', description: 'Sulit mengucapkan kata-kata', category: 'neurological', mb: 0.9, md: 0.05 },
        { id: 'G22', code: 'G22', name: 'Gangguan penglihatan mendadak', description: 'Penglihatan kabur secara tiba-tiba', category: 'neurological', mb: 0.85, md: 0.08 },
        { id: 'G23', code: 'G23', name: 'Kehilangan keseimbangan', description: 'Sulit menjaga keseimbangan', category: 'neurological', mb: 0.8, md: 0.1 },
        { id: 'G24', code: 'G24', name: 'Luka mulut tidak sembuh', description: 'Sariawan yang tidak kunjung sembuh', category: 'oral', mb: 0.9, md: 0.05 },
        { id: 'G25', code: 'G25', name: 'Bercak putih/merah di mulut', description: 'Perubahan warna pada gusi atau lidah', category: 'oral', mb: 0.85, md: 0.08 },
        { id: 'G26', code: 'G26', name: 'Suara serak berkepanjangan', description: 'Perubahan suara menjadi serak lebih dari 2 minggu', category: 'oral', mb: 0.85, md: 0.1 },
        { id: 'G27', code: 'G27', name: 'Kesulitan menelan (disfagia)', description: 'Merasa ada hambatan saat menelan', category: 'oral', mb: 0.85, md: 0.1 },
        { id: 'G28', code: 'G28', name: 'Benjolan di leher', description: 'Pembengkakan yang teraba di area leher', category: 'oral', mb: 0.8, md: 0.12 },
        { id: 'G29', code: 'G29', name: 'Disfungsi ereksi', description: 'Kesulitan mencapai atau mempertahankan ereksi', category: 'reproductive', mb: 0.85, md: 0.1 },
        { id: 'G30', code: 'G30', name: 'Penurunan libido', description: 'Berkurangnya minat atau hasrat seksual', category: 'reproductive', mb: 0.75, md: 0.15 },
        { id: 'G31', code: 'G31', name: 'Gangguan kesuburan', description: 'Kesulitan untuk memiliki keturunan', category: 'reproductive', mb: 0.7, md: 0.2 },
        { id: 'G32', code: 'G32', name: 'Pilek berulang', description: 'Hidung berair yang sering kambuh', category: 'respiratory', mb: 0.65, md: 0.2 },
        { id: 'G33', code: 'G33', name: 'Infeksi saluran napas berulang', description: 'Sering mengalami infeksi seperti bronkitis', category: 'respiratory', mb: 0.8, md: 0.1 }
      ];

      for (const s of symptoms) {
        await db.query(`
          INSERT INTO symptoms (id, code, name, description, category, mb, md)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [s.id, s.code, s.name, s.description, s.category, s.mb, s.md]);
      }

      console.log('✅ Symptoms seeded (33 items)');
    };

    // Seed Diseases
    const seedDiseases = async () => {
      const diseases = [
        { id: 'P1', code: 'P1', name: 'Kanker Paru-paru', description: 'Pertumbuhan sel abnormal di paru-paru. Merokok adalah penyebab utama.', probability: 0.85, severity: 'critical', prevention: ["Berhenti merokok","Hindari paparan asap rokok","Konsumsi makanan sehat"], treatment: ["Pembedahan","Kemoterapi","Radioterapi","Imunoterapi"], statistics: {"mortalityRate":"80-85%","survivalRate5Year":"15-20%"} },
        { id: 'P2', code: 'P2', name: 'Kanker Mulut', description: 'Kanker di jaringan mulut atau tenggorokan. Tembakau adalah faktor risiko utama.', probability: 0.75, severity: 'high', prevention: ["Berhenti merokok","Batasi alkohol","Pemeriksaan gigi rutin"], treatment: ["Pembedahan","Radioterapi","Kemoterapi"], statistics: {"mortalityRate":"40-50%","survivalRate5Year":"50-60%"} },
        { id: 'P3', code: 'P3', name: 'Kanker Tenggorokan', description: 'Tumor ganas di tenggorokan atau kotak suara.', probability: 0.7, severity: 'high', prevention: ["Berhenti merokok","Hindari alkohol berlebihan","Vaksinasi HPV"], treatment: ["Pembedahan","Radioterapi","Kemoterapi"], statistics: {"mortalityRate":"35-45%","survivalRate5Year":"55-65%"} },
        { id: 'P4', code: 'P4', name: 'Serangan Jantung', description: 'Infark miokard terjadi ketika aliran darah ke jantung tersumbat.', probability: 0.8, severity: 'critical', prevention: ["Berhenti merokok","Olahraga teratur","Kontrol tekanan darah"], treatment: ["PCI","Operasi bypass","Obat pengencer darah"], statistics: {"mortalityRate":"25-30%","survivalRate5Year":"70-75%"} },
        { id: 'P5', code: 'P5', name: 'PPOK', description: 'Penyakit paru-paru kronis yang menyebabkan kesulitan bernapas.', probability: 0.85, severity: 'high', prevention: ["Berhenti merokok","Hindari polusi udara","Vaksinasi flu"], treatment: ["Bronkodilator","Kortikosteroid","Terapi oksigen"], statistics: {"mortalityRate":"Penyebab kematian ke-3","riskIncrease":"10-13x pada perokok"} },
        { id: 'P6', code: 'P6', name: 'Stroke', description: 'Terjadi ketika suplai darah ke otak terganggu.', probability: 0.75, severity: 'critical', prevention: ["Berhenti merokok","Kontrol tekanan darah","Olahraga teratur"], treatment: ["tPA","Trombektomi","Rehabilitasi neurologis"], statistics: {"mortalityRate":"20-30%","survivalRate5Year":"50-70%"} },
        { id: 'P7', code: 'P7', name: 'ISPA', description: 'Infeksi saluran pernapasan akut. Perokok lebih rentan.', probability: 0.6, severity: 'moderate', prevention: ["Berhenti merokok","Cuci tangan teratur","Vaksinasi flu"], treatment: ["Istirahat cukup","Banyak minum","Obat pereda gejala"], statistics: {"mortalityRate":"Rendah","riskIncrease":"2-3x pada perokok"} },
        { id: 'P8', code: 'P8', name: 'Impotensi', description: 'Disfungsi ereksi akibat kerusakan pembuluh darah.', probability: 0.7, severity: 'moderate', prevention: ["Berhenti merokok","Batasi alkohol","Olahraga teratur"], treatment: ["Obat oral","Terapi hormon","Konseling psikologis"], statistics: {"mortalityRate":"Tidak mengancam jiwa","riskIncrease":"50% pada perokok"} }
      ];

      for (const d of diseases) {
        await db.query(`
          INSERT INTO diseases (id, code, name, description, probability, severity, prevention, treatment, statistics)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING
        `, [d.id, d.code, d.name, d.description, d.probability, d.severity, JSON.stringify(d.prevention), JSON.stringify(d.treatment), JSON.stringify(d.statistics)]);
      }

      console.log('✅ Diseases seeded (8 items)');
    };

    // Seed Rules
    const seedRules = async () => {
      const rules = [
        // Rules untuk Kanker Paru-paru (P1)
        { id: 'R01', symptomId: 'G01', diseaseId: 'P1', mb: 0.8, md: 0.1, weight: 0.9 },
        { id: 'R02', symptomId: 'G02', diseaseId: 'P1', mb: 0.95, md: 0.02, weight: 1.0 },
        { id: 'R03', symptomId: 'G03', diseaseId: 'P1', mb: 0.85, md: 0.1, weight: 0.95 },
        { id: 'R04', symptomId: 'G06', diseaseId: 'P1', mb: 0.9, md: 0.08, weight: 0.95 },
        { id: 'R05', symptomId: 'G11', diseaseId: 'P1', mb: 0.85, md: 0.1, weight: 0.9 },
        { id: 'R06', symptomId: 'G12', diseaseId: 'P1', mb: 0.7, md: 0.2, weight: 0.75 },
        { id: 'R07', symptomId: 'G13', diseaseId: 'P1', mb: 0.65, md: 0.2, weight: 0.7 },
        { id: 'R08', symptomId: 'G14', diseaseId: 'P1', mb: 0.75, md: 0.15, weight: 0.8 },
        { id: 'R09', symptomId: 'G15', diseaseId: 'P1', mb: 0.65, md: 0.2, weight: 0.7 },
        // Rules untuk Kanker Mulut (P2)
        { id: 'R10', symptomId: 'G08', diseaseId: 'P2', mb: 0.75, md: 0.15, weight: 0.8 },
        { id: 'R11', symptomId: 'G09', diseaseId: 'P2', mb: 0.85, md: 0.1, weight: 0.9 },
        { id: 'R12', symptomId: 'G11', diseaseId: 'P2', mb: 0.8, md: 0.12, weight: 0.85 },
        { id: 'R13', symptomId: 'G15', diseaseId: 'P2', mb: 0.65, md: 0.2, weight: 0.7 },
        { id: 'R14', symptomId: 'G24', diseaseId: 'P2', mb: 0.95, md: 0.03, weight: 1.0 },
        { id: 'R15', symptomId: 'G25', diseaseId: 'P2', mb: 0.9, md: 0.05, weight: 0.95 },
        { id: 'R16', symptomId: 'G27', diseaseId: 'P2', mb: 0.85, md: 0.1, weight: 0.9 },
        { id: 'R17', symptomId: 'G28', diseaseId: 'P2', mb: 0.8, md: 0.12, weight: 0.85 },
        // Rules untuk Kanker Tenggorokan (P3)
        { id: 'R18', symptomId: 'G08', diseaseId: 'P3', mb: 0.8, md: 0.12, weight: 0.85 },
        { id: 'R19', symptomId: 'G09', diseaseId: 'P3', mb: 0.9, md: 0.05, weight: 0.95 },
        { id: 'R20', symptomId: 'G11', diseaseId: 'P3', mb: 0.8, md: 0.12, weight: 0.85 },
        { id: 'R21', symptomId: 'G15', diseaseId: 'P3', mb: 0.65, md: 0.2, weight: 0.7 },
        { id: 'R22', symptomId: 'G26', diseaseId: 'P3', mb: 0.95, md: 0.03, weight: 1.0 },
        { id: 'R23', symptomId: 'G27', diseaseId: 'P3', mb: 0.88, md: 0.08, weight: 0.92 },
        { id: 'R24', symptomId: 'G28', diseaseId: 'P3', mb: 0.82, md: 0.1, weight: 0.87 },
        // Rules untuk Serangan Jantung (P4)
        { id: 'R25', symptomId: 'G03', diseaseId: 'P4', mb: 0.8, md: 0.12, weight: 0.85 },
        { id: 'R26', symptomId: 'G06', diseaseId: 'P4', mb: 0.88, md: 0.08, weight: 0.92 },
        { id: 'R27', symptomId: 'G07', diseaseId: 'P4', mb: 0.98, md: 0.01, weight: 1.0 },
        { id: 'R28', symptomId: 'G12', diseaseId: 'P4', mb: 0.7, md: 0.18, weight: 0.75 },
        { id: 'R29', symptomId: 'G16', diseaseId: 'P4', mb: 0.82, md: 0.1, weight: 0.87 },
        { id: 'R30', symptomId: 'G17', diseaseId: 'P4', mb: 0.75, md: 0.15, weight: 0.8 },
        { id: 'R31', symptomId: 'G18', diseaseId: 'P4', mb: 0.92, md: 0.05, weight: 0.95 },
        { id: 'R32', symptomId: 'G19', diseaseId: 'P4', mb: 0.65, md: 0.22, weight: 0.7 },
        // Rules untuk PPOK (P5)
        { id: 'R33', symptomId: 'G01', diseaseId: 'P5', mb: 0.88, md: 0.08, weight: 0.92 },
        { id: 'R34', symptomId: 'G03', diseaseId: 'P5', mb: 0.95, md: 0.03, weight: 1.0 },
        { id: 'R35', symptomId: 'G04', diseaseId: 'P5', mb: 0.9, md: 0.05, weight: 0.95 },
        { id: 'R36', symptomId: 'G05', diseaseId: 'P5', mb: 0.85, md: 0.1, weight: 0.9 },
        { id: 'R37', symptomId: 'G12', diseaseId: 'P5', mb: 0.7, md: 0.18, weight: 0.75 },
        { id: 'R38', symptomId: 'G17', diseaseId: 'P5', mb: 0.72, md: 0.16, weight: 0.77 },
        { id: 'R39', symptomId: 'G33', diseaseId: 'P5', mb: 0.85, md: 0.1, weight: 0.9 },
        // Rules untuk Stroke (P6)
        { id: 'R40', symptomId: 'G10', diseaseId: 'P6', mb: 0.92, md: 0.05, weight: 0.95 },
        { id: 'R41', symptomId: 'G19', diseaseId: 'P6', mb: 0.6, md: 0.25, weight: 0.65 },
        { id: 'R42', symptomId: 'G20', diseaseId: 'P6', mb: 0.98, md: 0.01, weight: 1.0 },
        { id: 'R43', symptomId: 'G21', diseaseId: 'P6', mb: 0.95, md: 0.03, weight: 0.97 },
        { id: 'R44', symptomId: 'G22', diseaseId: 'P6', mb: 0.88, md: 0.08, weight: 0.92 },
        { id: 'R45', symptomId: 'G23', diseaseId: 'P6', mb: 0.85, md: 0.1, weight: 0.9 },
        // Rules untuk ISPA (P7)
        { id: 'R46', symptomId: 'G01', diseaseId: 'P7', mb: 0.75, md: 0.15, weight: 0.8 },
        { id: 'R47', symptomId: 'G03', diseaseId: 'P7', mb: 0.7, md: 0.18, weight: 0.75 },
        { id: 'R48', symptomId: 'G04', diseaseId: 'P7', mb: 0.72, md: 0.16, weight: 0.77 },
        { id: 'R49', symptomId: 'G05', diseaseId: 'P7', mb: 0.78, md: 0.12, weight: 0.82 },
        { id: 'R50', symptomId: 'G08', diseaseId: 'P7', mb: 0.7, md: 0.18, weight: 0.75 },
        { id: 'R51', symptomId: 'G13', diseaseId: 'P7', mb: 0.65, md: 0.2, weight: 0.7 },
        { id: 'R52', symptomId: 'G32', diseaseId: 'P7', mb: 0.8, md: 0.12, weight: 0.85 },
        { id: 'R53', symptomId: 'G33', diseaseId: 'P7', mb: 0.88, md: 0.08, weight: 0.92 },
        // Rules untuk Impotensi (P8)
        { id: 'R54', symptomId: 'G29', diseaseId: 'P8', mb: 0.95, md: 0.03, weight: 1.0 },
        { id: 'R55', symptomId: 'G30', diseaseId: 'P8', mb: 0.85, md: 0.1, weight: 0.9 },
        { id: 'R56', symptomId: 'G31', diseaseId: 'P8', mb: 0.75, md: 0.15, weight: 0.8 }
      ];

      for (const r of rules) {
        await db.query(`
          INSERT INTO rules (id, symptom_id, disease_id, mb, md, weight)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING
        `, [r.id, r.symptomId, r.diseaseId, r.mb, r.md, r.weight]);
      }

      console.log('✅ Rules seeded (56 items)');
    };

    // Seed Education
    const seedEducation = async () => {
      const articles = [
        { title: 'Bahaya Merokok bagi Kesehatan', slug: 'bahaya-merokok', category: 'Bahaya Rokok', excerpt: 'Merokok adalah penyebab utama kematian yang dapat dicegah.', content: '<p>Merokok mempengaruhi hampir setiap organ dalam tubuh...</p>' },
        { title: 'Panduan Berhenti Merokok', slug: 'panduan-berhenti-merokok', category: 'Tips Berhenti', excerpt: 'Langkah-langkah praktis untuk berhenti merokok.', content: '<p>Berhenti merokok adalah keputusan terbaik untuk kesehatan...</p>' },
        { title: 'Manfaat Berhenti Merokok', slug: 'manfaat-berhenti-merokok', category: 'Motivasi', excerpt: 'Tubuh mulai memulihkan diri dalam hitungan menit.', content: '<p>20 menit setelah berhenti, tekanan darah mulai normal...</p>' }
      ];

      for (const a of articles) {
        await db.query(`
          INSERT INTO education (id, title, slug, category, excerpt, content, author, read_time, is_featured)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (slug) DO NOTHING
        `, [uuidv4(), a.title, a.slug, a.category, a.excerpt, a.content, 'Tim SI-DIROK', 5, true]);
      }

      console.log('✅ Education content seeded');
    };

    // Run all seeds
    await seedUsers();
    await seedSymptoms();
    await seedDiseases();
    await seedRules();
    await seedEducation();
    
    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    await db.close();
    process.exit(0);
  }
};

runSeed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
