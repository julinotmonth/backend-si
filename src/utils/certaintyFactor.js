/**
 * Certainty Factor (CF) Calculation Utility
 * Implementasi metode Certainty Factor untuk Sistem Pakar SI-DIROK
 * 
 * Formula:
 * CF = MB - MD
 * CFcombine = CF1 + CF2 × (1 - CF1) untuk nilai positif
 * CFcombine = CF1 + CF2 × (1 + CF1) untuk nilai negatif
 * CFcombine = (CF1 + CF2) / (1 - min(|CF1|, |CF2|)) untuk CF berbeda tanda
 */

/**
 * Menghitung CF individual dari rule dan tingkat keyakinan user
 * @param {number} mb - Measure of Belief dari rule
 * @param {number} md - Measure of Disbelief dari rule
 * @param {number} userCertainty - Tingkat keyakinan user (0.2 - 1.0)
 * @returns {number} - Nilai CF
 */
export const calculateCF = (mb, md, userCertainty) => {
  const cfRule = mb - md;
  const cf = cfRule * userCertainty;
  return cf;
};

/**
 * Mengkombinasikan dua nilai CF
 * @param {number} cf1 - CF pertama
 * @param {number} cf2 - CF kedua
 * @returns {number} - CF kombinasi
 */
export const combineCF = (cf1, cf2) => {
  if (cf1 >= 0 && cf2 >= 0) {
    // Keduanya positif
    return cf1 + cf2 * (1 - cf1);
  } else if (cf1 < 0 && cf2 < 0) {
    // Keduanya negatif
    return cf1 + cf2 * (1 + cf1);
  } else {
    // Berbeda tanda
    return (cf1 + cf2) / (1 - Math.min(Math.abs(cf1), Math.abs(cf2)));
  }
};

/**
 * Mengkombinasikan array nilai CF secara sequential
 * @param {number[]} cfValues - Array nilai CF
 * @returns {number} - CF hasil kombinasi
 */
export const combineMultipleCF = (cfValues) => {
  if (cfValues.length === 0) return 0;
  if (cfValues.length === 1) return cfValues[0];
  
  let result = cfValues[0];
  for (let i = 1; i < cfValues.length; i++) {
    result = combineCF(result, cfValues[i]);
  }
  return result;
};

/**
 * Melakukan diagnosis berdasarkan gejala yang dipilih user
 * @param {Array} selectedSymptoms - Array of { symptomId, certainty }
 * @param {Array} diseases - Array of disease objects from database
 * @param {Array} rules - Array of rule objects from database
 * @param {Array} symptoms - Array of symptom objects from database
 * @returns {Array} - Array hasil diagnosis terurut berdasarkan CF tertinggi
 */
export const diagnose = (selectedSymptoms, diseases, rules, symptoms) => {
  const results = [];
  
  // Iterasi setiap penyakit
  diseases.forEach(disease => {
    const cfValues = [];
    const matchedSymptoms = [];
    
    // Cari rules yang cocok dengan penyakit ini
    selectedSymptoms.forEach(({ symptomId, certainty }) => {
      const rule = rules.find(r => 
        r.symptom_id === symptomId && r.disease_id === disease.id
      );
      
      if (rule) {
        const cf = calculateCF(rule.mb, rule.md, certainty);
        cfValues.push(cf);
        
        // Simpan info gejala yang cocok
        const symptom = symptoms.find(s => s.id === symptomId);
        matchedSymptoms.push({
          symptom,
          rule,
          certainty,
          cf
        });
      }
    });
    
    // Hitung CF kombinasi jika ada rules yang cocok
    if (cfValues.length > 0) {
      const combinedCF = combineMultipleCF(cfValues);
      const percentage = Math.max(0, Math.min(100, combinedCF * 100));
      
      results.push({
        disease,
        cf: combinedCF,
        percentage: percentage.toFixed(2),
        matchedSymptoms,
        matchedCount: matchedSymptoms.length,
        totalSymptoms: disease.symptoms ? disease.symptoms.length : 0
      });
    }
  });
  
  // Sort berdasarkan CF tertinggi
  results.sort((a, b) => b.cf - a.cf);
  
  return results;
};

/**
 * Mendapatkan interpretasi hasil CF
 * @param {number} cf - Nilai CF (0-1)
 * @returns {Object} - Interpretasi { level, description, color, recommendation }
 */
export const interpretCF = (cf) => {
  const percentage = cf * 100;
  
  if (percentage >= 80) {
    return {
      level: 'Sangat Tinggi',
      description: 'Kemungkinan sangat besar menderita penyakit ini',
      color: 'red',
      recommendation: 'Segera konsultasikan ke dokter spesialis'
    };
  } else if (percentage >= 60) {
    return {
      level: 'Tinggi',
      description: 'Kemungkinan besar menderita penyakit ini',
      color: 'orange',
      recommendation: 'Disarankan untuk segera memeriksakan diri ke dokter'
    };
  } else if (percentage >= 40) {
    return {
      level: 'Sedang',
      description: 'Ada kemungkinan menderita penyakit ini',
      color: 'yellow',
      recommendation: 'Lakukan pemeriksaan lebih lanjut untuk memastikan'
    };
  } else if (percentage >= 20) {
    return {
      level: 'Rendah',
      description: 'Kemungkinan kecil menderita penyakit ini',
      color: 'green',
      recommendation: 'Tetap jaga kesehatan dan hindari rokok'
    };
  } else {
    return {
      level: 'Sangat Rendah',
      description: 'Kemungkinan sangat kecil menderita penyakit ini',
      color: 'green',
      recommendation: 'Tetap pertahankan gaya hidup sehat'
    };
  }
};

/**
 * Menghitung faktor risiko berdasarkan data diri
 * @param {Object} userData - { age, smokingYears, cigarettesPerDay }
 * @returns {Object} - Faktor risiko { multiplier, level, description, riskScore, packYears }
 */
export const calculateRiskFactor = ({ age, smokingYears, cigarettesPerDay }) => {
  let riskScore = 0;
  
  // Faktor usia
  if (age >= 60) riskScore += 3;
  else if (age >= 50) riskScore += 2;
  else if (age >= 40) riskScore += 1;
  
  // Faktor lama merokok
  if (smokingYears >= 20) riskScore += 4;
  else if (smokingYears >= 10) riskScore += 3;
  else if (smokingYears >= 5) riskScore += 2;
  else if (smokingYears >= 1) riskScore += 1;
  
  // Faktor jumlah rokok per hari
  if (cigarettesPerDay >= 20) riskScore += 4;
  else if (cigarettesPerDay >= 10) riskScore += 3;
  else if (cigarettesPerDay >= 5) riskScore += 2;
  else if (cigarettesPerDay >= 1) riskScore += 1;
  
  // Hitung pack-years (standar pengukuran paparan rokok)
  const packYears = (cigarettesPerDay / 20) * smokingYears;
  
  // Konversi ke multiplier (1.0 - 1.5)
  const multiplier = 1 + (riskScore / 22) * 0.5;
  
  let level, description;
  if (riskScore >= 9) {
    level = 'Sangat Tinggi';
    description = 'Riwayat merokok Anda menunjukkan risiko sangat tinggi';
  } else if (riskScore >= 6) {
    level = 'Tinggi';
    description = 'Riwayat merokok Anda menunjukkan risiko tinggi';
  } else if (riskScore >= 3) {
    level = 'Sedang';
    description = 'Riwayat merokok Anda menunjukkan risiko sedang';
  } else {
    level = 'Rendah';
    description = 'Riwayat merokok Anda menunjukkan risiko relatif rendah';
  }
  
  return {
    multiplier,
    level,
    description,
    riskScore,
    packYears: packYears.toFixed(1)
  };
};

/**
 * Menggabungkan hasil diagnosis dengan faktor risiko
 * @param {Array} diagnosisResults - Hasil dari fungsi diagnose()
 * @param {Object} riskFactor - Hasil dari fungsi calculateRiskFactor()
 * @returns {Array} - Hasil diagnosis dengan adjustment
 */
export const adjustDiagnosisWithRisk = (diagnosisResults, riskFactor) => {
  return diagnosisResults.map(result => {
    // Adjust CF dengan risk multiplier (tapi tetap max 1.0)
    const adjustedCF = Math.min(1, result.cf * riskFactor.multiplier);
    const adjustedPercentage = Math.max(0, Math.min(100, adjustedCF * 100));
    
    return {
      ...result,
      originalCF: result.cf,
      cf: adjustedCF,
      percentage: adjustedPercentage.toFixed(2),
      riskAdjusted: true
    };
  }).sort((a, b) => b.cf - a.cf);
};

/**
 * Membuat ringkasan diagnosis untuk laporan
 * @param {Array} results - Hasil diagnosis
 * @param {Object} userData - Data pengguna
 * @param {Object} riskFactor - Faktor risiko
 * @returns {Object} - Ringkasan diagnosis
 */
export const createDiagnosisSummary = (results, userData, riskFactor) => {
  const topResult = results[0];
  const interpretation = topResult ? interpretCF(topResult.cf) : null;
  
  return {
    timestamp: new Date().toISOString(),
    userData,
    riskFactor,
    primaryDiagnosis: topResult ? {
      disease: topResult.disease,
      percentage: topResult.percentage,
      interpretation,
      matchedSymptoms: topResult.matchedSymptoms
    } : null,
    secondaryDiagnoses: results.slice(1, 4).map(r => ({
      disease: r.disease,
      percentage: r.percentage,
      interpretation: interpretCF(r.cf)
    })),
    allResults: results,
    recommendations: generateRecommendations(results, riskFactor)
  };
};

/**
 * Generate rekomendasi berdasarkan hasil diagnosis
 * @param {Array} results - Hasil diagnosis
 * @param {Object} riskFactor - Faktor risiko
 * @returns {Array} - Array rekomendasi
 */
export const generateRecommendations = (results, riskFactor) => {
  const recommendations = [];
  
  // Rekomendasi umum
  recommendations.push({
    type: 'general',
    priority: 'high',
    title: 'Berhenti Merokok',
    description: 'Langkah terpenting adalah berhenti merokok sekarang juga. Semakin cepat berhenti, semakin cepat tubuh memulai proses pemulihan.'
  });
  
  // Rekomendasi berdasarkan hasil diagnosis
  const topResult = results[0];
  if (topResult && topResult.cf >= 0.6) {
    recommendations.push({
      type: 'medical',
      priority: 'urgent',
      title: 'Konsultasi Dokter Segera',
      description: `Berdasarkan gejala Anda, ada kemungkinan ${topResult.percentage}% terkait ${topResult.disease.name}. Segera konsultasikan ke dokter untuk pemeriksaan lebih lanjut.`
    });
  }
  
  // Rekomendasi berdasarkan pack-years
  if (parseFloat(riskFactor.packYears) >= 10) {
    recommendations.push({
      type: 'screening',
      priority: 'high',
      title: 'Skrining Kanker Paru',
      description: 'Dengan riwayat merokok Anda, disarankan untuk melakukan CT scan dada untuk deteksi dini kanker paru.'
    });
  }
  
  // Rekomendasi gaya hidup
  recommendations.push({
    type: 'lifestyle',
    priority: 'medium',
    title: 'Pola Hidup Sehat',
    description: 'Konsumsi makanan bergizi, olahraga teratur, tidur cukup, dan kelola stres dengan baik.'
  });
  
  return recommendations;
};

export default {
  calculateCF,
  combineCF,
  combineMultipleCF,
  diagnose,
  interpretCF,
  calculateRiskFactor,
  adjustDiagnosisWithRisk,
  createDiagnosisSummary,
  generateRecommendations
};
