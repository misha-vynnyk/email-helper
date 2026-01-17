/**
 * Theme Style Selector Component
 * Dropdown/menu to switch between component styles (default, floating, glassmorphism, neomorphic)
 */

import React from "react";

import { Style as StyleIcon } from "@mui/icons-material";
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from "@mui/material";

import { useThemeMode } from "./ThemeContext";
import { ThemeStyle } from "./tokens";

const styleOptions: Array<{ value: ThemeStyle; label: string; icon?: React.ReactNode }> = [
  { value: "default", label: "Default" },
  { value: "floating", label: "Floating Glass" },
  { value: "glassmorphism", label: "Glassmorphism" },
  { value: "neomorphic", label: "Neomorphic" },
];

export function ThemeStyleSelector() {
  const { style, setStyle } = useThemeMode();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (newStyle: ThemeStyle) => {
    setStyle(newStyle);
    handleClose();
  };

  return (
    <>
      <Tooltip title='Component Style'>
        <IconButton
          onClick={handleClick}
          size='small'
        >
          <StyleIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {styleOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={style === option.value}
            onClick={() => handleSelect(option.value)}
          >
            {option.icon && <ListItemIcon>{option.icon}</ListItemIcon>}
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
