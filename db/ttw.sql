-- phpMyAdmin SQL Dump
-- version 3.3.3
-- http://www.phpmyadmin.net
--
-- Хост: localhost
-- Время создания: Апр 29 2011 г., 11:39
-- Версия сервера: 5.1.50
-- Версия PHP: 5.3.5

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- База данных: `ttw`
--

-- --------------------------------------------------------

--
-- Структура таблицы `notes`
--

CREATE TABLE IF NOT EXISTS `notes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `noteText` text,
  `idNote` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf-8 AUTO_INCREMENT=139 ;
--
-- Структура таблицы `tasks`
--

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `idTask` varchar(45) NOT NULL,
  `name` text CHARACTER SET cp1251,
  `idParent` varchar(45) DEFAULT NULL,
  `state` varchar(45) NOT NULL DEFAULT '',
  `uiState` varchar(45) DEFAULT NULL,
  `pomsDone` text,
  `idUser` int(10) unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `FK_tasks_1` (`idUser`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf-8 AUTO_INCREMENT=336 ;


--
-- Структура таблицы `tasks_notes`
--

CREATE TABLE IF NOT EXISTS `tasks_notes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `idTaskDb` int(10) unsigned NOT NULL,
  `idNoteDb` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_tasks_notes_1` (`idTaskDb`),
  KEY `FK_tasks_notes_2` (`idNoteDb`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf-8 AUTO_INCREMENT=137 ;
--
-- Структура таблицы `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(45) NOT NULL,
  `password` varchar(45) NOT NULL,
  `email` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`) USING BTREE,
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf-8 AUTO_INCREMENT=70 ;


--
-- Ограничения внешнего ключа таблицы `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `FK_tasks_1` FOREIGN KEY (`idUser`) REFERENCES `users` (`id`);

--
-- Ограничения внешнего ключа таблицы `tasks_notes`
--
ALTER TABLE `tasks_notes`
  ADD CONSTRAINT `FK_tasks_notes_1` FOREIGN KEY (`idTaskDb`) REFERENCES `tasks` (`id`),
  ADD CONSTRAINT `FK_tasks_notes_2` FOREIGN KEY (`idNoteDb`) REFERENCES `notes` (`id`);
