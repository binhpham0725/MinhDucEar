<?php
/**
 * MinhDucEar - Centralized Database Connection Module (hluv-magazine-architecture standard)
 * Used by all api/endpoints/*.php
 */

require_once __DIR__ . '/../config/database.php';

function getDB() {
    return Database::getInstance()->getConnection();
}

$pdo = getDB();
