<?php
/**
 * ZANE TUTOR PORTAL - CSV MIGRATION SCRIPT
 * 
 * INSTRUCTIONS:
 * 1. Export your Forminator data as a CSV.
 * 2. Convert your CSV to a JSON array (there are many free "CSV to JSON" tools online).
 * 3. Paste that JSON array into the $csv_data variable below.
 * 4. Run this snippet ONCE to migrate all data into the portal.
 */

function zane_migrate_csv_data() {
    // PASTE YOUR JSON DATA HERE
    $csv_data = [
        /* 
        Example format:
        [
            "Email Address" => "peaceosanemosegun@gmail.com",
            "Gender" => "Female",
            "Years of Teaching Experience" => "6",
            "Student Success Stories" => "...",
            ...
        ]
        */
    ];

    if (empty($csv_data)) {
        return "Migration failed: No data provided in \$csv_data variable.";
    }

    $count = 0;
    foreach ($csv_data as $row) {
        $email = isset($row['Email Address']) ? trim($row['Email Address']) : '';
        if (!$email) continue;

        $user = get_user_by('email', $email);
        if (!$user) continue;

        $user_id = $user->ID;

        // Map Forminator fields to Portal fields
        if (isset($row['Phone'])) update_user_meta($user_id, 'zane_phone', $row['Phone']);
        if (isset($row['Gender'])) update_user_meta($user_id, 'zane_gender', $row['Gender']);
        if (isset($row['Date of Birth'])) update_user_meta($user_id, 'zane_dob', $row['Date of Birth']);
        if (isset($row['State of Origin'])) update_user_meta($user_id, 'zane_state_of_origin', $row['State of Origin']);
        
        // Qualification (Combine Institution + Course)
        $inst = isset($row['Higher Institution attended']) ? $row['Higher Institution attended'] : '';
        $course = isset($row['Course of study']) ? $row['Course of study'] : '';
        $degree = isset($row['Highest Degree Attained']) ? $row['Highest Degree Attained'] : '';
        if ($inst || $course) {
            $qual = "$degree in $course from $inst";
            update_user_meta($user_id, 'zane_qualification', $qual);
        }

        if (isset($row['Years of Teaching Experience'])) update_user_meta($user_id, 'zane_experience', $row['Years of Teaching Experience']);
        if (isset($row['Summary of teaching experience'])) update_user_meta($user_id, 'zane_brief_intro', $row['Summary of teaching experience']);
        if (isset($row['Student Success Stories'])) update_user_meta($user_id, 'zane_success_stories', $row['Student Success Stories']);
        if (isset($row['Teaching style'])) update_user_meta($user_id, 'zane_class_delivery', $row['Teaching style']);
        if (isset($row['Name & Address of Current Workplace/PPA'])) update_user_meta($user_id, 'zane_current_workplace', $row['Name & Address of Current Workplace/PPA']);
        
        // Corps Member Status
        $is_corps = (isset($row['Presently a Corps member?']) && strtolower($row['Presently a Corps member?']) === 'yes');
        update_user_meta($user_id, 'zane_is_corps_member', $is_corps ? 1 : 0);

        // Subjects (Merge all proficient subjects)
        $subjects = [];
        if (!empty($row['Select proficient senior secondary subjects'])) $subjects = array_merge($subjects, explode(',', $row['Select proficient senior secondary subjects']));
        if (!empty($row['Select proficient junior secondary subjects'])) $subjects = array_merge($subjects, explode(',', $row['Select proficient junior secondary subjects']));
        if (!empty($row['Select proficient primary subjects'])) $subjects = array_merge($subjects, explode(',', $row['Select proficient primary subjects']));
        if (!empty($subjects)) {
            $clean_subjects = array_map('trim', array_unique($subjects));
            update_user_meta($user_id, 'zane_subjects', $clean_subjects);
        }

        // Pricing Average
        if (isset($row['Flexible Pricing tiers'])) {
            preg_match_all('/\d+/', $row['Flexible Pricing tiers'], $matches);
            if (!empty($matches[0])) {
                $avg_rate = array_sum($matches[0]) / count($matches[0]);
                update_user_meta($user_id, 'zane_hourly_rate', $avg_rate);
            }
        }

        // Set onboarding step to verification since they have data
        update_user_meta($user_id, 'zane_onboarding_step', 'verification');

        $count++;
    }

    return "Success! Migrated data for $count tutors.";
}

// UNCOMMENT THE LINE BELOW TO RUN MIGRATION
// echo zane_migrate_csv_data();
