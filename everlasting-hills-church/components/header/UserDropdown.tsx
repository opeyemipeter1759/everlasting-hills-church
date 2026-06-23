'use client';
import { Dropdown } from '@/components/ui/dropdown/Dropdown';
import { DropdownItem } from '@/components/ui/dropdown/DropdownItem';
import { ArrowDown } from 'lucide-react';
import React, { useState } from 'react';
//import { useSelector } from 'react-redux';
//import { RootState } from '@/store';
//import { ArrowDropIcon } from '@/assets/icons';
//import Logout from '../auth/Logout';

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  //const user = useSelector((state: RootState) => state.profile.user);
  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="relative font-sans">
      <button
        onClick={toggleDropdown}
        className="flex items-center bg-[#055A52] px-4 font-medium py-2 rounded-full text-sm font-sans text-white-100 dark:text-gray-400 dropdown-toggle "
      >
        Quick Actions
        <ArrowDown /*  isOpen={isOpen} */ />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute bg-black-100 font-general  right-0 mt-[17px] flex w-[200px] md:w-[200px] flex-col dropdownborder"
      >
        <ul className="flex flex-col gap-1 ">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/dashboard/meetings"
              className="flex group font-general text-white-200 items-center gap-3 px-3 py-3  font-medium rounded-lg group text-theme-sm hover:bg-[linear-gradient(30deg,#055a5229,#4fbf053e)]  "
            >
              <div className="group inline-block mt-[2px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 17 17"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="gradIcon2" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#3CF239" />
                      <stop offset="100%" stopColor="#DDF239" />
                    </linearGradient>
                  </defs>
                  <path
                    className="stroke-[#F8F8F8] group-hover:opacity-0 transition-opacity duration-200"
                    d="M12.3078 4.10156H2.05139C1.76817 4.10156 1.53857 4.33116 1.53857 4.61438V11.7939C1.53857 12.0771 1.76817 12.3067 2.05139 12.3067H12.3078C12.591 12.3067 12.8206 12.0771 12.8206 11.7939V4.61438C12.8206 4.33116 12.591 4.10156 12.3078 4.10156Z"
                    strokeWidth="0.854701"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    className="stroke-[#F8F8F8] group-hover:opacity-0 transition-opacity duration-200"
                    d="M12.8206 7.17628L15.8975 5.125V11.2788L12.8206 9.22756"
                    strokeWidth="0.854701"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    stroke="url(#gradIcon2)"
                    d="M12.3078 4.10156H2.05139C1.76817 4.10156 1.53857 4.33116 1.53857 4.61438V11.7939C1.53857 12.0771 1.76817 12.3067 2.05139 12.3067H12.3078C12.591 12.3067 12.8206 12.0771 12.8206 11.7939V4.61438C12.8206 4.33116 12.591 4.10156 12.3078 4.10156Z"
                    strokeWidth="0.854701"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    stroke="url(#gradIcon2)"
                    d="M12.8206 7.17628L15.8975 5.125V11.2788L12.8206 9.22756"
                    strokeWidth="0.854701"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="group-hover:bg-[linear-gradient(90deg,#3CF239,#DDF239)] text-sm group-hover:font-medium group-hover:bg-clip-text group-hover:text-transparent">
                Join Live Meeting
              </span>
            </DropdownItem>
          </li>
          {/* <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/dashboard/profile"
              className="flex group font-sans text-white-200 items-center gap-3 px-3 py-2  font-medium rounded-lg group text-theme-sm hover:bg-[linear-gradient(30deg,#055a5229,#4fbf053e)] "
            >
              <div className="group inline-block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <defs>
                    <linearGradient
                      id="gradIconHover"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#3CF239" />
                      <stop offset="100%" stopColor="#DDF239" />
                    </linearGradient>
                  </defs>

                  {/* Original gray path *
                  <g clipPath="url(#clip0_1513_15803)">
                    <path
                      d="M3.00016 14.6693V11.3359M3.00016 4.66927V1.33594M1.3335 3.0026H4.66683M1.3335 13.0026H4.66683M8.66683 2.0026L7.51071 5.00851C7.3227 5.49733 7.2287 5.74174 7.08252 5.94733C6.95296 6.12954 6.79376 6.28873 6.61155 6.41829C6.40597 6.56447 6.16156 6.65848 5.67274 6.84649L2.66683 8.0026L5.67274 9.15872C6.16156 9.34673 6.40597 9.44073 6.61155 9.58692C6.79376 9.71648 6.95296 9.87567 7.08252 10.0579C7.2287 10.2635 7.3227 10.5079 7.51071 10.9967L8.66683 14.0026L9.82295 10.9967C10.011 10.5079 10.105 10.2635 10.2511 10.0579C10.3807 9.87567 10.5399 9.71648 10.7221 9.58692C10.9277 9.44073 11.1721 9.34673 11.6609 9.15872L14.6668 8.0026L11.6609 6.84649C11.1721 6.65848 10.9277 6.56447 10.7221 6.41829C10.5399 6.28873 10.3807 6.12954 10.2511 5.94733C10.105 5.74174 10.011 5.49733 9.82295 5.00851L8.66683 2.0026Z"
                      stroke="#8C8C8C"
                      className="transition-opacity duration-200 group-hover:opacity-0"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Gradient path on hover *
                    <path
                      d="M3.00016 14.6693V11.3359M3.00016 4.66927V1.33594M1.3335 3.0026H4.66683M1.3335 13.0026H4.66683M8.66683 2.0026L7.51071 5.00851C7.3227 5.49733 7.2287 5.74174 7.08252 5.94733C6.95296 6.12954 6.79376 6.28873 6.61155 6.41829C6.40597 6.56447 6.16156 6.65848 5.67274 6.84649L2.66683 8.0026L5.67274 9.15872C6.16156 9.34673 6.40597 9.44073 6.61155 9.58692C6.79376 9.71648 6.95296 9.87567 7.08252 10.0579C7.2287 10.2635 7.3227 10.5079 7.51071 10.9967L8.66683 14.0026L9.82295 10.9967C10.011 10.5079 10.105 10.2635 10.2511 10.0579C10.3807 9.87567 10.5399 9.71648 10.7221 9.58692C10.9277 9.44073 11.1721 9.34673 11.6609 9.15872L14.6668 8.0026L11.6609 6.84649C11.1721 6.65848 10.9277 6.56447 10.7221 6.41829C10.5399 6.28873 10.3807 6.12954 10.2511 5.94733C10.105 5.74174 10.011 5.49733 9.82295 5.00851L8.66683 2.0026Z"
                      stroke="url(#gradIconHover)"
                      className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>

                  <defs>
                    <clipPath id="clip0_1513_15803">
                      <rect width="16" height="16" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>

              <span className="group-hover:bg-[linear-gradient(90deg,#3CF239,#DDF239)] font-sans text-sm group-hover:font-medium group-hover:bg-clip-text group-hover:text-transparent">
                Start AI Proxy{' '}
              </span>
            </DropdownItem>
          </li> */}
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/dashboard/pipeline"
              className="flex group font-general-sans text-white-200 items-center gap-3 px-3 py-2  font-medium rounded-lg group text-theme-sm hover:bg-[linear-gradient(30deg,#055a5229,#4fbf053e)] "
            >
              <div className="group inline-block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <defs>
                    <linearGradient
                      id="gradHoverUser"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#3CF239" />
                      <stop offset="100%" stopColor="#DDF239" />
                    </linearGradient>
                  </defs>

                  {/* Original gray path */}
                  <path
                    d="M13.3332 14C13.3332 13.0696 13.3332 12.6044 13.2183 12.2259C12.9598 11.3736 12.2929 10.7067 11.4406 10.4482C11.0621 10.3333 10.5969 10.3333 9.6665 10.3333H6.33317C5.4028 10.3333 4.93761 10.3333 4.55908 10.4482C3.70681 10.7067 3.03986 11.3736 2.78133 12.2259C2.6665 12.6044 2.6665 13.0696 2.6665 14M10.9998 5C10.9998 6.65685 9.65669 8 7.99984 8C6.34298 8 4.99984 6.65685 4.99984 5C4.99984 3.34315 6.34298 2 7.99984 2C9.65669 2 10.9998 3.34315 10.9998 5Z"
                    stroke="#8C8C8C"
                    className="transition-opacity duration-200 group-hover:opacity-0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Gradient path on hover */}
                  <path
                    d="M13.3332 14C13.3332 13.0696 13.3332 12.6044 13.2183 12.2259C12.9598 11.3736 12.2929 10.7067 11.4406 10.4482C11.0621 10.3333 10.5969 10.3333 9.6665 10.3333H6.33317C5.4028 10.3333 4.93761 10.3333 4.55908 10.4482C3.70681 10.7067 3.03986 11.3736 2.78133 12.2259C2.6665 12.6044 2.6665 13.0696 2.6665 14M10.9998 5C10.9998 6.65685 9.65669 8 7.99984 8C6.34298 8 4.99984 6.65685 4.99984 5C4.99984 3.34315 6.34298 2 7.99984 2C9.65669 2 10.9998 3.34315 10.9998 5Z"
                    stroke="url(#gradHoverUser)"
                    className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <span className="group-hover:bg-[linear-gradient(90deg,#3CF239,#DDF239)] text-sm group-hover:font-medium group-hover:bg-clip-text group-hover:text-transparent">
                Add New Lead
              </span>
            </DropdownItem>
          </li>
          {/*   <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/dashboard/profile"
              className="flex group font-general-sans text-white-200 items-center gap-3 px-3 py-2  font-medium rounded-lg group text-theme-sm hover:bg-[linear-gradient(30deg,#055a5229,#4fbf053e)] "
            >
              <div className="group inline-block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="14"
                  viewBox="0 0 13 14"
                  fill="none"
                >
                  <defs>
                    <linearGradient
                      id="gradHoverPlus"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#3CF239" />
                      <stop offset="100%" stopColor="#DDF239" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M6.5 7.5V3.5M4.5 5.5H8.5M3.16667 10.5V12.057C3.16667 12.4122 3.16667 12.5898 3.23949 12.6811C3.30282 12.7604 3.39885 12.8066 3.50036 12.8065C3.61708 12.8063 3.75578 12.6954 4.03317 12.4735L5.62348 11.2012C5.94834 10.9413 6.11078 10.8114 6.29166 10.719C6.45213 10.637 6.62295 10.5771 6.79948 10.5408C6.99845 10.5 7.20646 10.5 7.6225 10.5H9.3C10.4201 10.5 10.9802 10.5 11.408 10.282C11.7843 10.0903 12.0903 9.7843 12.282 9.40798C12.5 8.98016 12.5 8.4201 12.5 7.3V3.7C12.5 2.57989 12.5 2.01984 12.282 1.59202C12.0903 1.21569 11.7843 0.909734 11.408 0.717987C10.9802 0.5 10.4201 0.5 9.3 0.5H3.7C2.5799 0.5 2.01984 0.5 1.59202 0.717987C1.21569 0.909734 0.909734 1.21569 0.717987 1.59202C0.5 2.01984 0.5 2.57989 0.5 3.7V7.83333C0.5 8.45331 0.5 8.7633 0.568148 9.01764C0.753083 9.70782 1.29218 10.2469 1.98236 10.4319C2.2367 10.5 2.54669 10.5 3.16667 10.5Z"
                    stroke="#8C8C8C"
                    className="transition-opacity duration-200 group-hover:opacity-0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <path
                    d="M6.5 7.5V3.5M4.5 5.5H8.5M3.16667 10.5V12.057C3.16667 12.4122 3.16667 12.5898 3.23949 12.6811C3.30282 12.7604 3.39885 12.8066 3.50036 12.8065C3.61708 12.8063 3.75578 12.6954 4.03317 12.4735L5.62348 11.2012C5.94834 10.9413 6.11078 10.8114 6.29166 10.719C6.45213 10.637 6.62295 10.5771 6.79948 10.5408C6.99845 10.5 7.20646 10.5 7.6225 10.5H9.3C10.4201 10.5 10.9802 10.5 11.408 10.282C11.7843 10.0903 12.0903 9.7843 12.282 9.40798C12.5 8.98016 12.5 8.4201 12.5 7.3V3.7C12.5 2.57989 12.5 2.01984 12.282 1.59202C12.0903 1.21569 11.7843 0.909734 11.408 0.717987C10.9802 0.5 10.4201 0.5 9.3 0.5H3.7C2.5799 0.5 2.01984 0.5 1.59202 0.717987C1.21569 0.909734 0.909734 1.21569 0.717987 1.59202C0.5 2.01984 0.5 2.57989 0.5 3.7V7.83333C0.5 8.45331 0.5 8.7633 0.568148 9.01764C0.753083 9.70782 1.29218 10.2469 1.98236 10.4319C2.2367 10.5 2.54669 10.5 3.16667 10.5Z"
                    stroke="url(#gradHoverPlus)"
                    className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <span className="group-hover:bg-[linear-gradient(90deg,#3CF239,#DDF239)] text-sm group-hover:font-medium group-hover:bg-clip-text group-hover:text-transparent">
                Launch Campaign{' '}
              </span>
            </DropdownItem>
          </li> */}
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/dashboard/meetings"
              className="flex group font-general-sans mb-2 text-white-200 items-center gap-3 px-3 py-2  font-medium rounded-lg group text-theme-sm hover:bg-[linear-gradient(30deg,#055a5229,#4fbf053e)] "
            >
              <div className="group inline-block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="15"
                  viewBox="0 0 13 15"
                  fill="none"
                >
                  <defs>
                    <linearGradient
                      id="gradHoverCalendar"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#3CF239" />
                      <stop offset="100%" stopColor="#DDF239" />
                    </linearGradient>
                  </defs>

                  {/* Default gray path */}
                  <path
                    d="M12.5 5.83333H0.5M9.16667 0.5V3.16667M3.83333 0.5V3.16667M3.7 13.8333H9.3C10.4201 13.8333 10.9802 13.8333 11.408 13.6153C11.7843 13.4236 12.0903 13.1176 12.282 12.7413C12.5 12.3135 12.5 11.7534 12.5 10.6333V5.03333C12.5 3.91323 12.5 3.35318 12.282 2.92535C12.0903 2.54903 11.7843 2.24307 11.408 2.05132C10.9802 1.83333 10.4201 1.83333 9.3 1.83333H3.7C2.5799 1.83333 2.01984 1.83333 1.59202 2.05132C1.21569 2.24307 0.909734 2.54903 0.717987 2.92535C0.5 3.35318 0.5 3.91323 0.5 5.03333V10.6333C0.5 11.7534 0.5 12.3135 0.717987 12.7413C0.909734 13.1176 1.21569 13.4236 1.59202 13.6153C2.01984 13.8333 2.5799 13.8333 3.7 13.8333Z"
                    stroke="#8C8C8C"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-opacity duration-200 group-hover:opacity-0"
                  />

                  {/* Gradient path on hover */}
                  <path
                    d="M12.5 5.83333H0.5M9.16667 0.5V3.16667M3.83333 0.5V3.16667M3.7 13.8333H9.3C10.4201 13.8333 10.9802 13.8333 11.408 13.6153C11.7843 13.4236 12.0903 13.1176 12.282 12.7413C12.5 12.3135 12.5 11.7534 12.5 10.6333V5.03333C12.5 3.91323 12.5 3.35318 12.282 2.92535C12.0903 2.54903 11.7843 2.24307 11.408 2.05132C10.9802 1.83333 10.4201 1.83333 9.3 1.83333H3.7C2.5799 1.83333 2.01984 1.83333 1.59202 2.05132C1.21569 2.24307 0.909734 2.54903 0.717987 2.92535C0.5 3.35318 0.5 3.91323 0.5 5.03333V10.6333C0.5 11.7534 0.5 12.3135 0.717987 12.7413C0.909734 13.1176 1.21569 13.4236 1.59202 13.6153C2.01984 13.8333 2.5799 13.8333 3.7 13.8333Z"
                    stroke="url(#gradHoverCalendar)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  />
                </svg>
              </div>

              <span className="group-hover:bg-[linear-gradient(90deg,#3CF239,#DDF239)] text-sm group-hover:font-medium group-hover:bg-clip-text group-hover:text-transparent">
                Create Meeting{' '}
              </span>
            </DropdownItem>
          </li>
          {/*  <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/dashboard/profile"
              className="flex group font-sans text-white-200 items-center gap-3 px-3 py-3  font-medium rounded-lg group text-theme-sm hover:bg-[linear-gradient(30deg,#055a5229,#4fbf053e)] "
            >
              <div className="group inline-block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="13"
                  viewBox="0 0 15 13"
                  fill="none"
                >
                  <defs>
                    <linearGradient
                      id="gradHoverUser"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#3CF239" />
                      <stop offset="100%" stopColor="#DDF239" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M11.8333 12.5V8.5M9.83333 10.5H13.8333M7.16667 8.5H4.5C3.25749 8.5 2.63623 8.5 2.14618 8.70299C1.49277 8.97364 0.973638 9.49277 0.702988 10.1462C0.5 10.6362 0.5 11.2575 0.5 12.5M9.5 0.693839C10.4773 1.08943 11.1667 2.04754 11.1667 3.16667C11.1667 4.28579 10.4773 5.2439 9.5 5.63949M8.16667 3.16667C8.16667 4.63943 6.97276 5.83333 5.5 5.83333C4.02724 5.83333 2.83333 4.63943 2.83333 3.16667C2.83333 1.69391 4.02724 0.5 5.5 0.5C6.97276 0.5 8.16667 1.69391 8.16667 3.16667Z"
                    stroke="#8C8C8C"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-opacity duration-200 group-hover:opacity-0"
                  />

                  <path
                    d="M11.8333 12.5V8.5M9.83333 10.5H13.8333M7.16667 8.5H4.5C3.25749 8.5 2.63623 8.5 2.14618 8.70299C1.49277 8.97364 0.973638 9.49277 0.702988 10.1462C0.5 10.6362 0.5 11.2575 0.5 12.5M9.5 0.693839C10.4773 1.08943 11.1667 2.04754 11.1667 3.16667C11.1667 4.28579 10.4773 5.2439 9.5 5.63949M8.16667 3.16667C8.16667 4.63943 6.97276 5.83333 5.5 5.83333C4.02724 5.83333 2.83333 4.63943 2.83333 3.16667C2.83333 1.69391 4.02724 0.5 5.5 0.5C6.97276 0.5 8.16667 1.69391 8.16667 3.16667Z"
                    stroke="url(#gradHoverUser)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  />
                </svg>
              </div>

              <span className="group-hover:bg-[linear-gradient(90deg,#3CF239,#DDF239)] text-sm group-hover:font-medium group-hover:bg-clip-text group-hover:text-transparent">
                Invite Colleagues{' '}
              </span>
            </DropdownItem>
          </li> */}
        </ul>
        {/*         /<Logout />
         */}{' '}
      </Dropdown>
    </div>
  );
}
