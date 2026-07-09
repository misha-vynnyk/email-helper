import{o as e,r as t}from"./rolldown-runtime-DAXXjFlN.js";import{a as n,i as r,o as i,r as a,t as o}from"./api-CPP4H5u1.js";import{i as s,n as c,r as l,t as u}from"./plus-DYhnn55x.js";import{a as d,i as f,o as p,t as m}from"./checkbox-B5IigE-k.js";import{t as h}from"./monitor-CnVogeja.js";import{t as g}from"./primitives-BIuI-SeG.js";import{a as _,c as v,i as y,n as b,o as x,r as S,s as C,t as w}from"./hooks-5w51Zb9f.js";import{t as T}from"./search-DoknEpFu.js";import{t as E}from"./smartphone-CXuoZnTL.js";import{A as D,B as O,D as k,E as A,F as j,H as M,I as N,M as P,N as F,O as I,T as L,V as R,W as z,b as ee,w as te}from"./index-D_e6_MmA.js";var ne=n(`arrow-down-to-line`,[[`path`,{d:`M12 17V3`,key:`1cwfxf`}],[`path`,{d:`m6 11 6 6 6-6`,key:`12ii2o`}],[`path`,{d:`M19 21H5`,key:`150jfl`}]]),re=n(`mouse-pointer-click`,[[`path`,{d:`M14 4.1 12 6`,key:`ita8i4`}],[`path`,{d:`m5.1 8-2.9-.8`,key:`1go3kf`}],[`path`,{d:`m6 12-1.9 2`,key:`mnht97`}],[`path`,{d:`M7.2 2.2 8 5.1`,key:`1cfko1`}],[`path`,{d:`M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z`,key:`s0h3yz`}]]),ie=n(`panel-top`,[[`rect`,{width:`18`,height:`18`,x:`3`,y:`3`,rx:`2`,key:`afitv7`}],[`path`,{d:`M3 9h18`,key:`1pudct`}]]),ae=n(`share-2`,[[`circle`,{cx:`18`,cy:`5`,r:`3`,key:`gq8acd`}],[`circle`,{cx:`6`,cy:`12`,r:`3`,key:`w7nqdw`}],[`circle`,{cx:`18`,cy:`19`,r:`3`,key:`1xt0gg`}],[`line`,{x1:`8.59`,x2:`15.42`,y1:`13.51`,y2:`17.49`,key:`47mynk`}],[`line`,{x1:`15.41`,x2:`8.59`,y1:`6.51`,y2:`10.49`,key:`1n3mei`}]]),oe=n(`tablet`,[[`rect`,{width:`16`,height:`20`,x:`4`,y:`2`,rx:`2`,ry:`2`,key:`76otgf`}],[`line`,{x1:`12`,x2:`12.01`,y1:`18`,y2:`18`,key:`1dp563`}]]),B=e(i());async function se(e){try{await te(e)}catch(e){console.warn(`[BlockImagePreloader] Failed to preload images:`,e)}}async function ce(e){let t=e.map(e=>e.html||e.preview||``).filter(Boolean).map(e=>se(e));await Promise.allSettled(t)}var V=new class{get baseUrl(){return`${o()}/api/blocks`}async fetchWithErrorHandling(e,t){try{let n=await fetch(e,{...t,headers:{"Content-Type":`application/json`,...t?.headers}}),r=await n.json();if(!n.ok)throw Error(r.error||r.message||`HTTP ${n.status}`);return r}catch(e){throw a.error(`blockFileApi`,`API request failed`,e),e}}async listBlocks(e,t){let n=new URLSearchParams;e&&n.append(`search`,e),t&&t!==`All`&&n.append(`category`,t);let r=`${this.baseUrl}/list${n.toString()?`?${n.toString()}`:``}`;return(await this.fetchWithErrorHandling(r)).blocks}async getBlock(e){let t=`${this.baseUrl}/${e}`;return(await this.fetchWithErrorHandling(t)).block}async createBlock(e){let t=this.baseUrl;return(await this.fetchWithErrorHandling(t,{method:`POST`,body:JSON.stringify(e)})).block}async updateBlock(e,t){let n=`${this.baseUrl}/${e}`;return(await this.fetchWithErrorHandling(n,{method:`PUT`,body:JSON.stringify(t)})).block}async deleteBlock(e){let t=`${this.baseUrl}/${e}`;return(await this.fetchWithErrorHandling(t,{method:`DELETE`})).success}async getBlockPaths(){let e=`${this.baseUrl}/settings/paths`;return(await fetch(e)).json()}},le=t({default:()=>ue}),ue={id:`buttons`,name:`Buttons`,category:`Custom`,keywords:[`buttons`,`buttons bg`,`rectangle button`],preview:``,html:`<!--=== Buttons ===-->
                                      <tr>
                                        <td style="margin: 0; padding: 0">
                                          <table border="0"
                                            cellpadding="0"
                                            cellspacing="0"
                                            width="100%"
                                            style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%; font-size: 0; text-align: center">
                                            <tr>
                                              <td class="footer-button"
                                                width="168"
                                                style="margin: 0; padding: 0; display: inline-block; vertical-align: top; font-size: 0; width: 168px">
                                                <table border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%;">
                                                  <tr>
                                                    <td class="footer-button-pad"
                                                      style="margin: 0; padding-right: 4px; padding-bottom: 8px; padding-left: 4px;">
                                                      <table border="0"
                                                        class="button-bg"
                                                        cellpadding="0"
                                                        cellspacing="0"
                                                        width="100%"
                                                        style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; min-width: 100%; border-radius: 4px;background-image: url(https://storage.5th-elementagency.com/files/templates/the-financial-visionary-v1/button-bg.png); background-repeat: no-repeat; background-position: center; background-size: 100% 100%;">
                                                        <tr>
                                                          <td align="center"
                                                            class="footer-button-inside-pad"
                                                            style="padding-top: 8px; padding-bottom: 8px; padding-right: 10px; padding-left: 10px;">
                                                            <table align="center"
                                                              border="0"
                                                              cellspacing="0"
                                                              cellpadding="0"
                                                              width="100%"
                                                              style="padding: 0; margin: 0; width: 100%; max-width: 100%;"
                                                              role="presentation">
                                                              <tr>
                                                                <td height="32"
                                                                  align="center"
                                                                  style="margin: 0; padding: 0; color: #462F77; text-align: center; font-family: 'Red Hat Display', sans-serif; font-size: 12px; font-weight: 700; line-height: 1;background-color: #ffffff; border-radius: 4px;padding-right: 10px; padding-left: 10px;">
                                                                  <a href="urlhere"
                                                                    style="color: #462F77; text-align: center; font-family: 'Red Hat Display', sans-serif; font-size: 12px; font-weight: 700; line-height: 1; text-decoration: none; display: block;padding-top: 10px; padding-bottom: 10px; padding-right: 6px; padding-left: 6px;">
                                                                    Privacy Policy
                                                                  </a>
                                                                </td>
                                                              </tr>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                              <td class="footer-button"
                                                width="168"
                                                style="margin: 0; padding: 0; display: inline-block; vertical-align: top; font-size: 0; width: 168px">
                                                <table border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%;">
                                                  <tr>
                                                    <td class="footer-button-pad"
                                                      style="margin: 0; padding-right: 4px; padding-bottom: 8px; padding-left: 4px;">
                                                      <table border="0"
                                                        class="button-bg"
                                                        cellpadding="0"
                                                        cellspacing="0"
                                                        width="100%"
                                                        style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; min-width: 100%; border-radius: 4px;background-image: url(https://storage.5th-elementagency.com/files/templates/the-financial-visionary-v1/button-bg.png); background-repeat: no-repeat; background-position: center; background-size: 100% 100%;">
                                                        <tr>
                                                          <td align="center"
                                                            class="footer-button-inside-pad"
                                                            style="padding-top: 8px; padding-bottom: 8px; padding-right: 10px; padding-left: 10px;">
                                                            <table align="center"
                                                              border="0"
                                                              cellspacing="0"
                                                              cellpadding="0"
                                                              width="100%"
                                                              style="padding: 0; margin: 0; width: 100%; max-width: 100%;"
                                                              role="presentation">
                                                              <tr>
                                                                <td height="32"
                                                                  align="center"
                                                                  style="margin: 0; padding: 0; color: #462F77; text-align: center; font-family: 'Red Hat Display', sans-serif; font-size: 12px; font-weight: 700; line-height: 1;background-color: #ffffff; border-radius: 4px;padding-right: 4px; padding-left: 4px;">
                                                                  <a href="urlhere"
                                                                    style="color: #462F77; text-align: center; font-family: 'Red Hat Display', sans-serif; font-size: 12px; font-weight: 700; line-height: 1; text-decoration: none; display: block;padding-top: 10px; padding-bottom: 10px; padding-right: 6px; padding-left: 6px;">
                                                                    Terms &amp; Conditions
                                                                  </a>
                                                                </td>
                                                              </tr>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                              <td class="footer-button"
                                                width="168"
                                                style="margin: 0; padding: 0; display: inline-block; vertical-align: top; font-size: 0; width: 168px">
                                                <table border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%;">
                                                  <tr>
                                                    <td class="footer-button-pad"
                                                      style="margin: 0; padding-right: 4px; padding-bottom: 8px; padding-left: 4px;">
                                                      <table border="0"
                                                        class="button-bg"
                                                        cellpadding="0"
                                                        cellspacing="0"
                                                        width="100%"
                                                        style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; min-width: 100%; border-radius: 4px;background-image: url(https://storage.5th-elementagency.com/files/templates/the-financial-visionary-v1/button-bg.png); background-repeat: no-repeat; background-position: center; background-size: 100% 100%;">
                                                        <tr>
                                                          <td align="center"
                                                            class="footer-button-inside-pad"
                                                            style="padding-top: 8px; padding-bottom: 8px; padding-right: 10px; padding-left: 10px;">
                                                            <table align="center"
                                                              border="0"
                                                              cellspacing="0"
                                                              cellpadding="0"
                                                              width="100%"
                                                              style="padding: 0; margin: 0; width: 100%; max-width: 100%;"
                                                              role="presentation">
                                                              <tr>
                                                                <td height="32"
                                                                  align="center"
                                                                  style="margin: 0; padding: 0; color: #462F77; text-align: center; font-family: 'Red Hat Display', sans-serif; font-size: 12px; font-weight: 700; line-height: 1;background-color: #ffffff; border-radius: 4px;padding-right: 10px; padding-left: 10px;">
                                                                  <a href="urlhere"
                                                                    style="color: #462F77; text-align: center; font-family: 'Red Hat Display', sans-serif; font-size: 12px; font-weight: 700; line-height: 1; text-decoration: none; display: block;padding-top: 10px; padding-bottom: 10px; padding-right: 6px; padding-left: 6px;">
                                                                    Unsubscribe
                                                                  </a>
                                                                </td>
                                                              </tr>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                      <!--=== Buttons-end ===-->`,createdAt:Date.now()},de=t({default:()=>fe}),fe={id:`divider`,name:`Divider`,category:`Custom`,keywords:[`divider`,`divider-icon`,`divider-combi`],preview:``,html:`<!--=============== Divider ===============-->
                          <tr>
                            <td class="divider-padding"
                              align="center"
                              style="margin: 0; padding-right: 20px; padding-left: 20px; padding-bottom: 30px;">
                              <table border="0"
                                cellpadding="0"
                                cellspacing="0"
                                width="520"
                                style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; width: 100%; max-width: 520px;">
                                <tr>
                                  <td width="40%"
                                    align="left"
                                    style="margin: 0; padding: 0; width: 45%;">
                                    <table border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      width="100%"
                                      style="width: 100%; max-width: 100%;">
                                      <tr>
                                        <td align="left"
                                          height="1"
                                          style="margin: 0; height: 1px; padding-top: 1px; border-bottom: 1px dashed #74A719;">
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  <td align="center"
                                    style="margin: 0; padding-right: 13px; padding-left: 13px;">
                                    <img class="logo-divider"
                                      alt="Hearth"
                                      width="145"
                                      src="https://storage.5th-elementagency.com/files/templates/health-prime-goods-v1/divider-icon.png"
                                      style="border: 0 none; margin: 0; padding: 0; width: 35px; max-width: 35px; object-fit: contain; object-position: center; font-size: 0" />
                                  </td>
                                  <td width="45%"
                                    align="right"
                                    style="margin: 0; padding: 0; width: 40%;">
                                    <table border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      width="100%"
                                      style="width: 100%; max-width: 100%;">
                                      <tr>
                                        <td align="right"
                                          height="1"
                                          style="margin: 0; height: 1px; padding-top: 1px; border-bottom: 1px dashed #74A719;">
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!--=============== Divider-end ===============-->`,createdAt:Date.now()},pe=t({default:()=>me}),me={id:`editor-left-image`,name:`Editor left image`,category:`Custom`,keywords:[`editor`,`left image`,`complicate image`],preview:``,html:`<!--=============== Editor ===============-->
                          <tr>
                            <td align="center"
                              class="editor-pad"
                              style="padding-right: 30px; padding-left: 30px; padding-top: 23px; padding-bottom: 10px;">
                              <table align="center"
                                border="0"
                                cellspacing="0"
                                cellpadding="0"
                                width="540"
                                style="width: 100%; max-width:540px; padding: 0; margin: 0"
                                role="presentation">
                                <tr>
                                  <td>
                                    <table border="0"
                                      cellspacing="0"
                                      role="presentation"
                                      cellpadding="0"
                                      width="100%"
                                      style="width: 100%; max-width: 100%; padding: 0; margin: 0;">
                                      <tr>
                                        <td valign="bottom"
                                          align="right"
                                          width="22.963%"
                                          style="width: 22.963%; padding: 0; margin: 0;">
                                          <a href="urlhere"
                                            target="_blank">
                                            <img alt="Woman"
                                              height="auto"
                                              src="https://storage.5th-elementagency.com/files/templates/the-paws-post-v1/editor-left-top.png"
                                              style="border:0; display:block; outline:none;text-decoration:none; height:auto; width:100%; max-width: 124px; font-size:13px;"
                                              width="124" />
                                          </a>
                                        </td>
                                        <td width="77.037%"
                                          valign="bottom"
                                          align="center"
                                          style="background-color: #A95D00; border-radius: 20px 20px 20px 0; width: 77.037%;">
                                          <table align="center"
                                            border="0"
                                            cellspacing="0"
                                            cellpadding="0"
                                            width="100%"
                                            style="width: 100%; max-width:100%; padding: 0; margin: 0;"
                                            role="presentation">
                                            <tr>
                                              <td valign="bottom"
                                                align="left"
                                                width="6.09%"
                                                style="width: 6.09%; padding: 0; margin: 0;">
                                                <img alt="---"
                                                  height="auto"
                                                  src="https://storage.5th-elementagency.com/files/templates/the-paws-post-v1/editor-top-right.png"
                                                  style="border:0; display:block; outline:none;text-decoration:none; height:auto; width:100%; max-width: 26px; font-size:13px; border-radius: 20px 0 0 0;"
                                                  width="25" />
                                              </td>
                                              <td width="93.91%"
                                                align="center"
                                                style="width: 93.91%;">
                                                <table align="center"
                                                  border="0"
                                                  cellspacing="0"
                                                  cellpadding="0"
                                                  width="100%"
                                                  style="width: 100%; max-width:100%; padding: 0; margin: 0;"
                                                  role="presentation">
                                                  <tr>
                                                    <td class="editor-text-title"
                                                      style="padding: 0; margin: 0; border: 0; color: #ffffff; font-family: 'Baloo 2', Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; line-height: 1.2;font-style: normal;text-align: left; padding-bottom: 8px; padding-top: 32px; padding-right: 21px; padding-left: 15px;">
                                                      <span style="color: #ffffff; font-family: 'Baloo 2', Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; line-height: 1.2;font-style: normal; text-align: left;">
                                                        Wishing your furry friends a lifetime of health and happiness!
                                                      </span>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td class="editor-text-subtitle"
                                                      style="padding: 0; margin: 0; border: 0; color: #ffffff; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 500; line-height: 1.2;font-style: normal;text-align: left; padding-bottom: 32px; padding-left: 15px; padding-right: 21px;">
                                                      <span style="color: #ffffff; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 500; line-height: 1.2;font-style: normal; text-align: left;">
                                                        Editor’s Name, editor
                                                      </span>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <tr>
                                  <td valign="top"
                                    align="left"
                                    style="padding: 0; margin: 0;">
                                    <table align="left"
                                      border="0"
                                      cellspacing="0"
                                      cellpadding="0"
                                      style="padding: 0; margin: 0; font-size: 0; line-height: 0; mso-line-height-rule:exactly;"
                                      role="presentation">
                                      <tr>
                                        <td valign="top"
                                          align="left"
                                          width="29.816%"
                                          style="padding: 0; margin: 0; width: 29.816%; font-size: 0; line-height: 0; mso-line-height-rule:exactly;">
                                          <img alt="---"
                                            height="auto"
                                            src="https://storage.5th-elementagency.com/files/templates/the-paws-post-v1/editor-bottom.png"
                                            style="border:0; display:block; outline:none;text-decoration:none; height:auto; width:100%; max-width: 161px; font-size:13px;"
                                            width="164" />
                                        </td>
                                        <td width="70.184%"
                                          style="padding: 0; margin: 0; width: 70.184%; font-size: 0; line-height: 0; mso-line-height-rule:exactly;"></td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!--=============== Editor-end ===============-->`,createdAt:Date.now()},he=t({default:()=>ge}),ge={id:`editor-note-simple`,name:`Editor note simple`,category:`Custom`,keywords:[`editor`,`simple editor`,`only text`],preview:``,html:`<!--=============== Editor ===============-->
                          <tr>
                            <td align="center"
                              style="padding-right: 20px; padding-left: 20px; padding-bottom: 24px;">
                              <table align="center"
                                border="0"
                                cellspacing="0"
                                cellpadding="0"
                                width="552"
                                style="width: 100%; max-width:552px; padding: 0; margin: 0; background-color: #DADDE0;"
                                role="presentation">
                                <tr>
                                  <td style="font-family:'Times New Roman', Arial, Helvetica, sans-serif;font-size:20px;font-style:normal;font-weight:700;line-height:1.5;text-align:center;color:#ECE9E2;padding-top: 2px; padding-bottom: 2px; background-color: #333333;">
                                    <span style="font-family:'Times New Roman', Arial, Helvetica, sans-serif;font-size:20px;font-style:normal;font-weight:700;line-height:1.5;text-align:center;color:#ECE9E2;">
                                      Editor's Note
                                    </span>
                                  </td>
                                </tr>
                                <tr>
                                  <td class="editor-text editor-text-pad"
                                    style="font-family:'Times New Roman', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:700;line-height:1.5;text-align:left;color:#000000;padding-top: 27px; padding-bottom: 32px; padding-right: 16px; padding-left: 16px;">
                                    <span style="font-family:'Times New Roman', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:700;line-height:1.5;text-align:left;color:#000000;">
                                      At times, our affiliate partners reach out to the Editors at The King of Stocks with special opportunities for our readers. The message below is one we think you should take a close, serious look at
                                    </span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!--=============== Editor-end ===============-->`,createdAt:Date.now()},_e=t({default:()=>ve}),ve={id:`editor-with-custom-frame`,name:`Editor with custom frame`,category:`Custom`,keywords:[`editor`,`custom frame`,`background frame`,`editor name`],preview:``,html:`<!--=============== Editor ===============-->
                                      <tr>
                                        <td align="center"
                                          class="editor-pad"
                                          style="padding-bottom: 10px; padding-right: 4px; padding-left: 4px;">
                                          <table align="center"
                                            border="0"
                                            cellspacing="0"
                                            cellpadding="0"
                                            width="100%"
                                            style="width: 100%; max-width: 100%; padding: 0; margin: 0;background-image: url(https://storage.5th-elementagency.com/files/templates/daily-market-clue-v1/editor-bg-top.png); background-position: top center; background-repeat: no-repeat; background-size: contain;"
                                            role="presentation">
                                            <tr>
                                              <td>
                                                <table border="0"
                                                  cellspacing="0"
                                                  role="presentation"
                                                  cellpadding="0"
                                                  width="100%"
                                                  style="width: 100%; padding: 0; margin: 0; background-image: url(https://storage.5th-elementagency.com/files/templates/daily-market-clue-v1/editor-icon.png); background-position: top left; background-repeat: no-repeat;">
                                                  <!--[if mso | IE]>
                                                  <tr>
                                                    <td align="left">
                                                      <table class="main-table" border="0"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        width="210" style="width: 210px;max-width: 100%;">
                                                  <![endif]-->
                                                  <tr>
                                                    <td align="left"
                                                      style="padding-right: 30px; padding-left: 30px; ">
                                                      <table align="left"
                                                        border="0"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        width="150"
                                                        style="width: 100%; max-width:150px; padding: 0; margin: 0; background-color: #515568;"
                                                        role="presentation">
                                                        <tr>
                                                          <td style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:700;line-height:1.5;text-align:center;color:#F1ECE2;padding-top: 3px; padding-bottom: 3px; white-space: nowrap;text-transform: uppercase;">
                                                            <span style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:700;line-height:1.5;text-align:center;color:#F1ECE2; white-space: nowrap; text-transform: uppercase;">
                                                              Editor Name
                                                            </span>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                  <!--[if mso | IE]>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                  <![endif]-->
                                                  <tr>
                                                    <td align="center">
                                                      <table align="center"
                                                        border="0"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        width="100%"
                                                        style="width: 100%; max-width:100%; padding: 0; margin: 0;"
                                                        role="presentation">
                                                        <tr>
                                                          <td align="center"
                                                            style="padding-bottom: 36px;background-image: url(https://storage.5th-elementagency.com/files/templates/daily-market-clue-v1/editor-bg-bottom.png); background-position: bottom center; background-repeat: no-repeat; background-size: contain;">
                                                            <table align="center"
                                                              border="0"
                                                              cellspacing="0"
                                                              cellpadding="0"
                                                              width="100%"
                                                              style="width: 100%; max-width:100%; padding: 0; margin: 0;border-radius: 8px; background-image: url(https://storage.5th-elementagency.com/files/templates/daily-market-clue-v1/editor-pattern.png); background-position: center center; background-repeat: repeat-y; background-size: contain;"
                                                              role="presentation">
                                                              <tr>
                                                                <td style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#1F1F1F;padding-top: 17px; padding-right: 16px; padding-left: 16px;">
                                                                  <span style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#1F1F1F;">
                                                                    Vestibulum auctor ornare leo, non suscipit magna interdum eu. Curabitur pellentesque nibh nibh, at maximus ante fermentum sit amet. Pellentesque commodo lacus at sodales sodales.
                                                                  </span>
                                                                </td>
                                                              </tr>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                      <!--=============== Editor-end ===============-->`,createdAt:Date.now()},ye=t({default:()=>be}),be={id:`editor-without-inline-block-40-60`,name:`Editor without inline-block 40/60`,category:`Content`,keywords:[`editor`,`image left`,`text right`,`40/60`,`transparent bg`],preview:``,html:`<!--=============== Editor ===============-->
  <tr>
    <td align="center"
      class="editor-pad"
      style="padding-bottom: 30px; padding-right: 10px; padding-left: 10px;">
      <table align="center"
        border="0"
        cellspacing="0"
        cellpadding="0"
        width="550"
        style="width: 100%; max-width:550px; padding: 0; margin: 0"
        role="presentation">
        <tr>
          <td valign="top"
            align="center"
            style="padding-right: 10px; padding-left: 10px; width: 36%;">
            <a href="urlhere"
              target="_blank">
              <img alt="Woman"
                height="auto"
                src="https://storage.5th-elementagency.com/files/templates/fit-as-fiddles-v1/editor-image.png"
                style="border:0; display:block; outline:none;text-decoration:none; height:auto; width:100%;max-width: 174px; font-size:13px;"
                width="174" />
            </a>
          </td>
          <td class="editor-text"
            style="font-family:'Montserrat', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-right: 10px; padding-left: 10px;">
            <span style="font-family:'Montserrat', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
              Balance, strength, and rhythm Fit as Fiddles brings you the best of both worlds. <br>
              The message above is in perfect harmony with what we love—check it out!
              <br><br>
              <b>
                Move with passion, play with heart, <br>
                Emma & Sophie Carter <br>
                Chief Editors of Fit as Fiddles
              </b>
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <!--=============== Editor-end ===============-->`,createdAt:Date.now()},xe=t({default:()=>Se}),Se={id:`note-content`,name:`Note content`,category:`Content`,keywords:[`note`,`two column`,`image left`,`display inline block`,`text right`,`text right with button`],preview:``,html:`<tr>
                            <td align="center"
                              style="padding-right: 10px; padding-left: 10px; padding-bottom: 26px;">
                              <table border="0"
                                align="center"
                                cellspacing="0"
                                cellpadding="0"
                                role="presentation"
                                width="570"
                                style="width: 100%; max-width: 570px;">
                                <tr>
                                  <td align="center"
                                    class="note-container-pad"
                                    style="padding-bottom: 8px;">
                                    <table align="center"
                                      border="0"
                                      cellspacing="0"
                                      cellpadding="0"
                                      width="100%"
                                      style="width: 100%; max-width:100%; padding: 0; margin: 0; font-size: 0; line-height: 0; mso-line-height-rule:exactly; text-align: center;"
                                      role="presentation">
                                      <tr>
                                        <td valign="top"
                                          align="center"
                                          class="d-i-b"
                                          width="40%"
                                          style="display: inline-block; width: 40%; max-width: 100%; min-width: 227px;font-size: 0; line-height: 0; mso-line-height-rule:exactly;">
                                          <table border="0"
                                            cellspacing="0"
                                            cellpadding="0"
                                            role="presentation"
                                            width="100%"
                                            style="width: 100%;">
                                            <tr>
                                              <td align="center"
                                                style="padding-right: 10px; padding-left: 10px; padding-bottom: 13px;">
                                                <a href="urlhere"
                                                  target="_blank">
                                                  <img alt="Woman"
                                                    class="d-i-b note-image-desk"
                                                    height="auto"
                                                    src="https://storage.5th-elementagency.com/files/templates/fit-as-fiddles-v1/note-image.jpg"
                                                    style="border:0; display:block; outline:none;text-decoration:none; height:auto; width:100%;max-width: 207px; font-size:13px; border-radius: 20px;"
                                                    width="207" />
                                                  <!--[if !mso 9]><!-->
                                                  <img alt="Woman"
                                                    class="d-i-b note-image-mob"
                                                    height="auto"
                                                    src="https://storage.5th-elementagency.com/files/templates/fit-as-fiddles-v1/note-image-wide.jpg"
                                                    style="border:0; display:none; outline:none;text-decoration:none; height:auto; width:100%;max-width: 207px; font-size:13px; border-radius: 20px;"
                                                    width="207" />
                                                  <!--<![endif]-->
                                                </a>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                        <td align="center"
                                          class="d-i-b"
                                          width="58%"
                                          style="display: inline-block; width: 58%; max-width: 100%; min-width: 288px;font-size: 0; line-height: 0; mso-line-height-rule:exactly;">
                                          <table border="0"
                                            cellspacing="0"
                                            cellpadding="0"
                                            role="presentation"
                                            width="100%"
                                            style="width: 100%;">
                                            <tr>
                                              <td class="note-text"
                                                style="font-family:'Montserrat', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-right: 10px; padding-left: 10px; padding-bottom: 13px;">
                                                <span style="font-family:'Montserrat', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                                                  Aliquam et facilisi libero tellus tellus neque blandit.
                                                  <br><br>
                                                  Orci at dolor nulla nam. Commodo dignissim luctus fringilla lacus.
                                                </span>
                                              </td>
                                            </tr>
                                            <!--=============== Button ===============-->
                                            <tr>
                                              <td align="left"
                                                style="margin: 0; padding: 0;">
                                                <table border="0"
                                                  class="button"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="170"
                                                  style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; width: 100%;max-width: 170px;">
                                                  <tr>
                                                    <td class="button-pad"
                                                      style="margin: 0; padding-bottom: 13px;padding-right: 10px; padding-left: 10px;">
                                                      <table border="0"
                                                        cellpadding="0"
                                                        cellspacing="0"
                                                        width="100%"
                                                        style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; min-width: 100%; border-radius: 59px; border: 1px solid #404040; background-color: #CBE956;">
                                                        <tr>
                                                          <td align="center"
                                                            height="41"
                                                            style="margin: 0; padding: 0; color: #000000; font-size: 12px; font-weight: 700; line-height: normal; font-family: 'aktiv-grotesk-extended', Arial, Helvetica, sans-serif; white-space: nowrap; text-decoration: none;text-transform: uppercase;">
                                                            <a href="urlhere"
                                                              target="_blank"
                                                              style="color: #000000; font-size: 12px; font-weight: 700; line-height: normal;font-family: 'aktiv-grotesk-extended', Arial, Helvetica, sans-serif; white-space: nowrap; text-decoration: none; display: block;text-transform: uppercase;">
                                                              <span style="display: table">
                                                                <span style="display: table-cell; vertical-align: middle; color: #000000; text-align: center; font-size: 12px; font-weight: 700; line-height: normal; text-decoration: none; font-family: 'aktiv-grotesk-extended', Arial, Helvetica, sans-serif; padding-left: 8px; padding-right: 8px; padding-top: 9px; padding-bottom: 9px; white-space: nowrap; text-decoration: none;text-transform: uppercase;">SEE MORE</span>
                                                                <!--[if !mso 9]><!-->
                                                                <span style="display: table-cell; vertical-align: middle; text-align: left; width: 15px; min-width: 15px">
                                                                  <img alt="---"
                                                                    height="15"
                                                                    width="15"
                                                                    src="https://storage.5th-elementagency.com/files/templates/fit-as-fiddles-v1/button-icon.png"
                                                                    style="border: 0 none; margin: 0; padding: 0; width: 15px; height: 15px; object-fit: contain; object-position: center; font-size: 0" />
                                                                </span>
                                                                <!--<![endif]-->
                                                              </span>
                                                            </a>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                            <!--=============== Button-end ===============-->
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center"
                                    class="note-container-pad"
                                    style="padding-bottom: 8px;">
                                    <table align="center"
                                      border="0"
                                      cellspacing="0"
                                      cellpadding="0"
                                      width="100%"
                                      style="width: 100%; max-width:100%; padding: 0; margin: 0; font-size: 0; line-height: 0; mso-line-height-rule:exactly; text-align: center;"
                                      role="presentation">
                                      <tr>
                                        <td valign="top"
                                          align="center"
                                          class="d-i-b"
                                          width="40%"
                                          style="display: inline-block; width: 40%; max-width: 100%; min-width: 227px;font-size: 0; line-height: 0; mso-line-height-rule:exactly;">
                                          <table border="0"
                                            cellspacing="0"
                                            cellpadding="0"
                                            role="presentation"
                                            width="100%"
                                            style="width: 100%;">
                                            <tr>
                                              <td align="center"
                                                style="padding-right: 10px; padding-left: 10px; padding-bottom: 13px;">
                                                <a href="urlhere"
                                                  target="_blank">
                                                  <img alt="Woman"
                                                    class="d-i-b note-image-desk"
                                                    height="auto"
                                                    src="https://storage.5th-elementagency.com/files/templates/fit-as-fiddles-v1/note-image.jpg"
                                                    style="border:0; display:block; outline:none;text-decoration:none; height:auto; width:100%;max-width: 207px; font-size:13px; border-radius: 20px;"
                                                    width="207" />
                                                  <!--[if !mso 9]><!-->
                                                  <img alt="Woman"
                                                    class="d-i-b note-image-mob"
                                                    height="auto"
                                                    src="https://storage.5th-elementagency.com/files/templates/fit-as-fiddles-v1/note-image-wide.jpg"
                                                    style="border:0; display:none; outline:none;text-decoration:none; height:auto; width:100%;max-width: 207px; font-size:13px; border-radius: 20px;"
                                                    width="207" />
                                                  <!--<![endif]-->
                                                </a>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                        <td align="center"
                                          class="d-i-b"
                                          width="58%"
                                          style="display: inline-block; width: 58%; max-width: 100%; min-width: 288px;font-size: 0; line-height: 0; mso-line-height-rule:exactly;">
                                          <table border="0"
                                            cellspacing="0"
                                            cellpadding="0"
                                            role="presentation"
                                            width="100%"
                                            style="width: 100%;">
                                            <tr>
                                              <td class="note-text"
                                                style="font-family:'Montserrat', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-right: 10px; padding-left: 10px; padding-bottom: 13px;">
                                                <span style="font-family:'Montserrat', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                                                  Aliquam et facilisi libero tellus tellus neque blandit.
                                                  <br><br>
                                                  Orci at dolor nulla nam. Commodo dignissim luctus fringilla lacus.
                                                </span>
                                              </td>
                                            </tr>
                                            <!--=============== Button ===============-->
                                            <tr>
                                              <td align="left"
                                                style="margin: 0; padding: 0;">
                                                <table border="0"
                                                  class="button"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="170"
                                                  style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; width: 100%;max-width: 170px;">
                                                  <tr>
                                                    <td class="button-pad"
                                                      style="margin: 0; padding-bottom: 13px;padding-right: 10px; padding-left: 10px;">
                                                      <table border="0"
                                                        cellpadding="0"
                                                        cellspacing="0"
                                                        width="100%"
                                                        style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; min-width: 100%; border-radius: 59px; border: 1px solid #404040; background-color: #CBE956;">
                                                        <tr>
                                                          <td align="center"
                                                            height="41"
                                                            style="margin: 0; padding: 0; color: #000000; font-size: 12px; font-weight: 700; line-height: normal; font-family: 'aktiv-grotesk-extended', Arial, Helvetica, sans-serif; white-space: nowrap; text-decoration: none;text-transform: uppercase;">
                                                            <a href="urlhere"
                                                              target="_blank"
                                                              style="color: #000000; font-size: 12px; font-weight: 700; line-height: normal;font-family: 'aktiv-grotesk-extended', Arial, Helvetica, sans-serif; white-space: nowrap; text-decoration: none; display: block;text-transform: uppercase;">
                                                              <span style="display: table">
                                                                <span style="display: table-cell; vertical-align: middle; color: #000000; text-align: center; font-size: 12px; font-weight: 700; line-height: normal; text-decoration: none; font-family: 'aktiv-grotesk-extended', Arial, Helvetica, sans-serif; padding-left: 8px; padding-right: 8px; padding-top: 9px; padding-bottom: 9px; white-space: nowrap; text-decoration: none;text-transform: uppercase;">SEE MORE</span>
                                                                <!--[if !mso 9]><!-->
                                                                <span style="display: table-cell; vertical-align: middle; text-align: left; width: 15px; min-width: 15px">
                                                                  <img alt="---"
                                                                    height="15"
                                                                    width="15"
                                                                    src="https://storage.5th-elementagency.com/files/templates/fit-as-fiddles-v1/button-icon.png"
                                                                    style="border: 0 none; margin: 0; padding: 0; width: 15px; height: 15px; object-fit: contain; object-position: center; font-size: 0" />
                                                                </span>
                                                                <!--<![endif]-->
                                                              </span>
                                                            </a>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                            <!--=============== Button-end ===============-->
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>`,createdAt:Date.now()},Ce=t({default:()=>we}),we={id:`note-sponsored-content`,name:`Note Sponsored content`,category:`Custom`,keywords:[`note`,`sponsored`,`content`,`sponsored content`,`link with dots`,`dots`],preview:``,html:`<!--=============== Note ===============-->
                          <tr>
                            <td align="center"
                              bgcolor="#ffffff"
                              style="padding-top: 10px; padding-right: 16px; padding-left: 16px; padding-bottom: 12px; background-color: #ffffff">
                              <table align="center"
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                style="width: 100%; max-width: 552px">
                                <tr>
                                  <td align="left"
                                    style="padding-right: 10px; margin: 0; color: #747474; font-family: 'Roboto', Arial, Helvetica, sans-serif; font-size: 14px; font-style: normal; font-weight: 500; line-height: 1.2; text-transform: uppercase;">
                                    <span style="padding: 0; margin: 0; color: #747474; font-family: 'Roboto', Arial, Helvetica, sans-serif; font-size: 14px; font-style: normal; font-weight: 500; line-height: 1.2; text-transform: uppercase;">Sponsored Content</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td class="note-padding"
                              align="center"
                              bgcolor="#ffffff"
                              style="padding-right: 16px; padding-left: 16px; padding-bottom: 24px;">
                              <table border="0"
                                cellpadding="0"
                                cellspacing="0"
                                bgcolor="#F8F8F8"
                                width="100%"
                                style="width: 100%; max-width: 552px; background-color: #F8F8F8; border: 1px solid #E8E8E8; border-radius: 4px; border-collapse: separate;">
                                <tr>
                                  <td align="left"
                                    valign="top"
                                    width="25"
                                    style="width: 25px; max-width: 25px; color: #6E3C9F; margin: 0; font-family: 'Montserrat', Arial, Helvetica, sans-serif; font-size: 16px; font-style: normal; font-weight: 00; line-height: 1.5; padding-top: 24px; padding-bottom: 8px; padding-left: 10px;">•</td>
                                  <td align="left"
                                    style=" margin: 0; color: #ADADAD; font-family: 'Montserrat', Arial, Helvetica, sans-serif; font-size: 16px; font-style: normal; font-weight: 400; line-height: 1.5; padding-top: 24px; padding-bottom: 8px; padding-right: 15px;">
                                    <a href="urlhere"
                                      target="_blank"
                                      style="padding: 0; margin: 0; color: #6E3C9F; font-family: 'Montserrat', Arial, Helvetica, sans-serif; font-size: 16px; font-style: normal; font-weight: 700; line-height: 1.5; text-decoration: underline">Aliquam et facilisi libero tellus tellus neque blandit.</a> <br>
                                    (partner’s name)
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!--=============== Note-end ===============-->`,createdAt:Date.now()},H=class extends Error{constructor(e,t){super(e),this.cause=t,this.name=`BlockStorageError`}},Te=class extends H{constructor(e=`Storage quota exceeded. Please delete some blocks or use file storage.`){super(e),this.name=`BlockQuotaExceededError`}},Ee=class extends H{constructor(e=`Network error. Please check your connection and try again.`){super(e),this.name=`BlockNetworkError`}};function De(e){return e instanceof DOMException&&e.name===`QuotaExceededError`?new Te:e instanceof Error?e.message.includes(`network`)||e.message.includes(`fetch`)?new Ee(e.message):new H(e.message,e):new H(`Unknown error occurred`)}function U(e){return e instanceof Te?`💾 Storage quota exceeded. Please delete some blocks or use file storage.`:e instanceof Ee?`🌐 Network error. Check your connection and try again.`:e instanceof H||e instanceof Error?`❌ ${e.message}`:`❌ An unknown error occurred`}var Oe=ee.CUSTOM_BLOCKS;async function ke(){let e=Object.assign({"../blocks/buttons.ts":le,"../blocks/divider.ts":de,"../blocks/editor-left-image.ts":pe,"../blocks/editor-note-simple.ts":he,"../blocks/editor-with-custom-frame.ts":_e,"../blocks/editor-without-inline-block-40-60.ts":ye,"../blocks/note-content.ts":xe,"../blocks/note-sponsored-content.ts":Ce}),t=[];for(let n in e){let r=e[n];r.default&&t.push(r.default)}return t.sort((e,t)=>e.name.localeCompare(t.name))}function W(){try{let e=localStorage.getItem(Oe);if(e)return JSON.parse(e)}catch(e){a.error(`blockLoader`,`Failed to load custom blocks`,e)}return[]}function G(e){try{localStorage.setItem(Oe,JSON.stringify(e))}catch(e){let t=De(e);throw a.error(`blockLoader`,`Failed to save custom blocks`,t),t}}function Ae(e){let t=W(),n={...e,id:`custom-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,createdAt:Date.now(),isCustom:!0};return t.push(n),G(t),n}function je(e,t){let n=W(),r=n.findIndex(t=>t.id===e);if(r===-1)return null;let i={...n[r],...t,id:e,isCustom:!0};return n[r]=i,G(n),i}function Me(e){G(W().filter(t=>t.id!==e))}function Ne(e,t,n){let r=e;if(n&&n!==`All`&&(r=r.filter(e=>e.category===n)),t.trim()){let e=t.toLowerCase();r=r.filter(t=>t.name.toLowerCase().includes(e)||t.keywords.some(t=>t.toLowerCase().includes(e))||t.category.toLowerCase().includes(e))}return r}function Pe(e){let t=new Set;return e.forEach(e=>t.add(e.category)),[`All`,...Array.from(t).sort()]}var K=new S(ee.BLOCK_STORAGE_LOCATIONS,`BlockStorage`);function q(e=!1){return K.getLocations(e)}function Fe(e,t,n){return K.addLocation(e,t,n)}function Ie(e){return K.toggleLocationVisibility(e)}function Le(e){return K.removeLocation(e)}function Re(e){return K.setDefaultLocation(e)}var J={MAX_BLOCK_NAME_LENGTH:100,MAX_HTML_LENGTH:5e4,MAX_KEYWORD_LENGTH:50,MIN_KEYWORDS_REQUIRED:1,MAX_KEYWORDS:20},ze={AUTO_HIDE_SUCCESS:3e3,AUTO_HIDE_ERROR:5e3,DEBOUNCE_SEARCH:300},Y={SKELETON_COUNT:6,PREVIEW_HEIGHT:180,MAX_KEYWORDS_DISPLAY:3},X=r(),Be=[`Structure`,`Content`,`Buttons`,`Footer`,`Headers`,`Social`,`Custom`];function Ve({open:e,onClose:t,onBlockAdded:n}){let[r,i]=(0,B.useState)(``),[o,s]=(0,B.useState)(`Custom`),[c,l]=(0,B.useState)(``),[d,f]=(0,B.useState)(``),[p,h]=(0,B.useState)([]),[_,v]=(0,B.useState)(!0),y=q(!1),[b,x]=(0,B.useState)((y.find(e=>e.isDefault)||y[0])?.id||``),[S,C]=(0,B.useState)(null),[w,T]=(0,B.useState)(!1),E=()=>{i(``),s(`Custom`),l(``),f(``),h([]),C(null)},D=()=>{E(),t()},O=()=>{let e=d.trim();e&&!p.includes(e)&&(h([...p,e]),f(``))},A=e=>{h(p.filter(t=>t!==e))},M=e=>{e.key===`Enter`&&(e.preventDefault(),O())},N=async()=>{if(!r.trim()){C(`Block name is required`);return}if(r.length>J.MAX_BLOCK_NAME_LENGTH){C(`Block name is too long (max ${J.MAX_BLOCK_NAME_LENGTH} characters)`);return}if(!c.trim()){C(`HTML code is required`);return}if(c.length>J.MAX_HTML_LENGTH){C(`HTML code is too long (max ${J.MAX_HTML_LENGTH.toLocaleString()} characters)`);return}if(p.length<J.MIN_KEYWORDS_REQUIRED){C(`At least ${J.MIN_KEYWORDS_REQUIRED} keyword is required`);return}if(p.length>J.MAX_KEYWORDS){C(`Too many keywords (max ${J.MAX_KEYWORDS})`);return}if(p.some(e=>e.length>J.MAX_KEYWORD_LENGTH)){C(`Keywords are too long (max ${J.MAX_KEYWORD_LENGTH} characters each)`);return}try{if(T(!0),C(null),_){if(y.length===0){C(`No storage locations configured. Please add a location in Storage settings.`);return}let e=r.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``),t=y.find(e=>e.id===b);if(!t){C(`Selected storage location not found`);return}let i=await V.createBlock({id:e,name:r.trim(),category:o,keywords:p,html:c.trim(),preview:``,targetPath:t.path});n({id:i.id,name:i.name,category:i.category,keywords:i.keywords,html:i.html,preview:i.preview,createdAt:i.createdAt||Date.now(),isCustom:!0})}else n(Ae({name:r.trim(),category:o,keywords:p,html:c.trim(),preview:``}));E(),t()}catch(e){a.error(`AddBlockModal`,`Failed to add block`,e);let t=e instanceof Error?e.message:`Failed to add block. Please try again.`;C(t)}finally{T(!1)}},P=`w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground outline-none transition-all`;return(0,X.jsx)(k,{open:e,onClose:D,maxWidthClass:`max-w-2xl`,title:`Add Custom Email Block`,actionsRow:(0,X.jsxs)(X.Fragment,{children:[(0,X.jsx)(`button`,{onClick:D,disabled:w,className:`px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all disabled:opacity-50`,children:`Cancel`}),(0,X.jsxs)(`button`,{onClick:N,disabled:!r||!c||p.length===0||w,className:`flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm disabled:opacity-50`,children:[w?(0,X.jsx)(j,{size:16,className:`animate-spin`}):(0,X.jsx)(u,{size:16}),w?`Creating...`:_?`Create .ts File`:`Add to Storage`]})]}),children:(0,X.jsxs)(`div`,{className:`flex flex-col gap-5`,children:[S&&(0,X.jsx)(g,{tone:`error`,children:S}),(0,X.jsxs)(`div`,{children:[(0,X.jsxs)(`label`,{className:`block text-sm font-extrabold text-foreground mb-1.5`,children:[`Block Name`,(0,X.jsx)(`span`,{className:`text-destructive`,children:` *`})]}),(0,X.jsx)(`input`,{type:`text`,value:r,onChange:e=>i(e.target.value),placeholder:`e.g., My Custom Header`,className:P})]}),(0,X.jsxs)(`div`,{children:[(0,X.jsxs)(`label`,{className:`block text-sm font-extrabold text-foreground mb-1.5`,children:[`Category`,(0,X.jsx)(`span`,{className:`text-destructive`,children:` *`})]}),(0,X.jsx)(`select`,{value:o,onChange:e=>s(e.target.value),className:`${P} appearance-none cursor-pointer`,children:Be.map(e=>(0,X.jsx)(`option`,{value:e,children:e},e))})]}),(0,X.jsxs)(`div`,{className:`bg-muted/40 p-4 rounded-xl border border-border/50`,children:[(0,X.jsxs)(`label`,{className:`flex items-start gap-2.5 cursor-pointer`,children:[(0,X.jsx)(m,{checked:_,onCheckedChange:e=>v(e===!0),className:`mt-0.5`}),(0,X.jsxs)(`div`,{children:[(0,X.jsx)(`p`,{className:`text-sm font-bold text-foreground`,children:`Save as TypeScript file (.ts)`}),(0,X.jsx)(`p`,{className:`text-xs text-muted-foreground mt-0.5`,children:_?`✅ Will create file (recommended for version control)`:`Will save to localStorage (temporary storage)`})]})]}),_&&(0,X.jsx)(X.Fragment,{children:y.length===0?(0,X.jsx)(`div`,{className:`mt-3`,children:(0,X.jsx)(g,{tone:`warning`,children:`No storage locations configured! Please add a location in Storage settings before creating file blocks, or switch to localStorage.`})}):(0,X.jsxs)(`div`,{className:`mt-3`,children:[(0,X.jsx)(`label`,{className:`block text-sm font-extrabold text-foreground mb-1.5`,children:`Save Location`}),(0,X.jsx)(`select`,{value:b,onChange:e=>x(e.target.value),className:`${P} appearance-none cursor-pointer`,children:y.map(e=>(0,X.jsxs)(`option`,{value:e.id,children:[`📁 `,e.name,e.isDefault&&` (Default)`,` — `,e.path]},e.id))})]})})]}),(0,X.jsxs)(`div`,{children:[(0,X.jsx)(`label`,{className:`block text-sm font-extrabold text-foreground mb-1.5`,children:`Keywords`}),(0,X.jsxs)(`div`,{className:`flex gap-2`,children:[(0,X.jsx)(`input`,{type:`text`,value:d,onChange:e=>f(e.target.value),onKeyPress:M,placeholder:`Type and press Enter to add`,className:P}),(0,X.jsx)(`button`,{onClick:O,disabled:!d.trim(),className:`shrink-0 px-3 rounded-xl border border-input text-foreground hover:bg-muted transition-colors disabled:opacity-50`,children:(0,X.jsx)(u,{size:18})})]}),(0,X.jsx)(`p`,{className:`text-xs text-muted-foreground mt-1.5`,children:`Add keywords to make your block easier to find`}),p.length>0&&(0,X.jsx)(`div`,{className:`flex flex-wrap gap-1.5 mt-2`,children:p.map(e=>(0,X.jsxs)(`span`,{className:`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-border/50`,children:[e,(0,X.jsx)(`button`,{onClick:()=>A(e),className:`p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors`,children:(0,X.jsx)(I,{size:12})})]},e))})]}),(0,X.jsxs)(`div`,{children:[(0,X.jsxs)(`label`,{className:`block text-sm font-extrabold text-foreground mb-1.5`,children:[`HTML Code`,(0,X.jsx)(`span`,{className:`text-destructive`,children:` *`})]}),(0,X.jsx)(`textarea`,{rows:12,value:c,onChange:e=>l(e.target.value),placeholder:`Paste your email-safe HTML code here...`,className:`${P} font-mono resize-y`}),(0,X.jsx)(`p`,{className:`text-xs text-muted-foreground mt-1.5`,children:`Use table-based layout with inline styles for best email compatibility`})]})]})})}var Z=`w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground outline-none transition-all`;function He({open:e,onClose:t,onSave:n}){let[r,i]=(0,B.useState)(q(!0)),[a,o]=(0,B.useState)(``),[s,c]=(0,B.useState)(``),[l,d]=(0,B.useState)(``),[f,p]=(0,B.useState)(!1),[m,h]=(0,B.useState)(null),[v,y]=(0,B.useState)(!1),b=()=>{try{if(!a.trim()||!s.trim()){h(`Name and path are required`);return}let e=s.trim();if(!e.startsWith(`/`)){h(`Path must be absolute (start with /). Example: /Users/your-name/Documents/blocks`);return}let t=Fe(a,e,l);i(t),o(``),c(``),d(``),p(!1),h(null)}catch(e){h(e instanceof Error?e.message:`Failed to add location`)}},x=e=>{try{let t=Ie(e);i(t),h(null)}catch(e){h(e instanceof Error?e.message:`Failed to toggle visibility`)}},S=e=>{try{let t=Le(e);i(t),h(null)}catch(e){h(e instanceof Error?e.message:`Failed to remove location`)}},C=e=>{try{let t=Re(e);i(t),h(null)}catch(e){h(e instanceof Error?e.message:`Failed to set default`)}},w=()=>{i(q(!0)),o(``),c(``),d(``),p(!1),h(null),y(!1),t()};return(0,X.jsx)(k,{open:e,onClose:w,maxWidthClass:`max-w-2xl`,title:(0,X.jsxs)(`span`,{className:`flex items-center gap-2`,children:[(0,X.jsx)(O,{size:20}),` Block Storage Locations`]}),actionsRow:(0,X.jsxs)(X.Fragment,{children:[(0,X.jsx)(`button`,{onClick:w,className:`px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all`,children:`Cancel`}),(0,X.jsx)(`button`,{onClick:()=>{y(!0),setTimeout(()=>{y(!1),n&&n(),w()},500)},className:`px-5 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm`,children:`Save Configuration`})]}),children:(0,X.jsxs)(`div`,{className:`flex flex-col gap-4`,children:[v&&(0,X.jsx)(g,{tone:`success`,children:`Configuration saved!`}),m&&(0,X.jsx)(g,{tone:`error`,children:m}),(0,X.jsxs)(g,{tone:`info`,children:[(0,X.jsx)(`strong`,{children:`Paths:`}),` Use `,(0,X.jsx)(`strong`,{children:`relative`})," paths (e.g. `src/blocks`) or",` `,(0,X.jsx)(`strong`,{children:`absolute`}),` paths within your Documents folder. Click ⭐ to set default.`]}),r.length>0?(0,X.jsx)(`div`,{className:`flex flex-col gap-2`,children:r.map(e=>(0,X.jsxs)(`div`,{className:A(`flex items-start justify-between gap-3 p-3 rounded-xl border`,e.isDefault?`border-primary bg-primary/5`:`border-border bg-card`),children:[(0,X.jsxs)(`div`,{className:`min-w-0`,children:[(0,X.jsxs)(`div`,{className:`flex items-center gap-2 flex-wrap`,children:[(0,X.jsx)(`span`,{className:A(`text-sm`,e.isDefault?`font-semibold`:`font-normal`,e.isHidden&&`line-through opacity-60`),children:e.name}),e.isDefault&&!e.isHidden&&(0,X.jsx)(`span`,{className:`px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary`,children:`Default`}),e.isHidden&&(0,X.jsx)(`span`,{className:`px-2 py-0.5 rounded-full text-[10px] font-bold border border-border text-muted-foreground`,children:`Hidden`})]}),(0,X.jsxs)(`p`,{className:`text-xs text-muted-foreground mt-1 break-all`,children:[`📁 `,e.path]}),e.description&&(0,X.jsx)(`p`,{className:`text-xs text-muted-foreground mt-0.5`,children:e.description})]}),(0,X.jsxs)(`div`,{className:`flex items-center gap-1 shrink-0`,children:[(0,X.jsx)(`button`,{onClick:()=>x(e.id),title:e.isHidden?`Show location`:`Hide location`,className:`p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors`,children:e.isHidden?(0,X.jsx)(M,{size:16}):(0,X.jsx)(R,{size:16})}),(0,X.jsx)(`button`,{onClick:()=>C(e.id),disabled:e.isDefault||e.isHidden,title:`Set as default`,className:`p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors disabled:opacity-40`,children:(0,X.jsx)(_,{size:16,className:e.isDefault?`fill-primary text-primary`:``})}),(0,X.jsx)(`button`,{onClick:()=>S(e.id),title:`Remove location`,className:`p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors`,children:(0,X.jsx)(D,{size:16})})]})]},e.id))}):(0,X.jsx)(g,{tone:`warning`,children:`No storage locations configured. Add at least one location.`}),f?(0,X.jsxs)(`div`,{className:`border-2 border-dashed border-primary/50 p-4 rounded-xl`,children:[(0,X.jsx)(`p`,{className:`text-sm font-bold text-foreground mb-3`,children:`➕ Add New Location`}),(0,X.jsxs)(`div`,{className:`flex flex-col gap-3`,children:[(0,X.jsxs)(`div`,{children:[(0,X.jsx)(`label`,{className:`block text-xs font-bold text-foreground mb-1`,children:`Location Name`}),(0,X.jsx)(`input`,{type:`text`,value:a,onChange:e=>o(e.target.value),placeholder:`e.g., Custom Blocks, External Project`,className:Z})]}),(0,X.jsxs)(`div`,{children:[(0,X.jsx)(`label`,{className:`block text-xs font-bold text-foreground mb-1`,children:`Directory Path`}),(0,X.jsx)(`input`,{type:`text`,value:s,onChange:e=>c(e.target.value),placeholder:`e.g., /Users/your-name/Documents/my-blocks`,className:Z}),(0,X.jsx)(`p`,{className:`text-xs text-muted-foreground mt-1`,children:`Must be an absolute path (start with /)`})]}),(0,X.jsxs)(`div`,{children:[(0,X.jsx)(`label`,{className:`block text-xs font-bold text-foreground mb-1`,children:`Description (optional)`}),(0,X.jsx)(`input`,{type:`text`,value:l,onChange:e=>d(e.target.value),placeholder:`e.g., Shared blocks for multiple projects`,className:Z})]}),(0,X.jsxs)(`div`,{className:`flex gap-2`,children:[(0,X.jsxs)(`button`,{onClick:b,className:`flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm`,children:[(0,X.jsx)(u,{size:16}),` Add Location`]}),(0,X.jsx)(`button`,{onClick:()=>{p(!1),o(``),c(``),d(``),h(null)},className:`px-4 py-2.5 text-sm font-bold border border-input text-foreground hover:bg-muted rounded-xl transition-all`,children:`Cancel`})]})]})]}):(0,X.jsxs)(`button`,{onClick:()=>p(!0),className:`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold border-2 border-dashed border-input text-foreground hover:bg-muted rounded-xl transition-all`,children:[(0,X.jsx)(u,{size:16}),` Add Storage Location`]}),(0,X.jsxs)(g,{tone:`warning`,children:[(0,X.jsx)(`strong`,{children:`Security:`}),` Paths outside project directory must be within your Documents folder. Backend validates all paths to prevent unauthorized access.`]})]})})}var Ue={Structure:(0,X.jsx)(N,{size:14}),Layout:(0,X.jsx)(N,{size:14}),Content:(0,X.jsx)(p,{size:14}),Buttons:(0,X.jsx)(re,{size:14}),Footer:(0,X.jsx)(ne,{size:14}),Footers:(0,X.jsx)(ne,{size:14}),Headers:(0,X.jsx)(ie,{size:14}),Social:(0,X.jsx)(ae,{size:14}),Custom:(0,X.jsx)(_,{size:14})},We=e=>Ue[e],Ge=`<!DOCTYPE html
PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  lang="en">

  <head>
    <meta http-equiv="Content-Type"
      content="text/html; charset=utf-8" />
    <title>Email Preview</title>
    <meta name="viewport"
      content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect"
      href="https://fonts.googleapis.com">
    <link rel="preconnect"
      href="https://fonts.gstatic.com"
      crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
      rel="stylesheet">
    <link rel="stylesheet"
      href="https://use.typekit.net/gwv4ydc.css">
    <style type="text/css">
      body {
        width: 100% !important;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        margin: 0;
        padding: 0;
        line-height: 100%;
      }

      * {
        box-sizing: border-box !important;
      }

      img {
        outline: none;
        text-decoration: none;
        border: none;
        -ms-interpolation-mode: bicubic;
        max-width: 100%;
        margin: 0;
        padding: 0;
      }

      table td {
        border-collapse: collapse;
      }

      table {
        border-collapse: collapse;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }

      [style*="Roboto"] {
        font-family: "Roboto", Arial, Helvetica, sans-serif;
      }

      @media screen and (-webkit-min-device-pixel-ratio: 0) {
        [style*="Roboto"] {
          font-family: "Roboto", Arial, Helvetica, sans-serif;
        }
      }

      @media screen and (max-width: 602px) {
        table.main-bg {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 100% !important;
        }

        img {
          background-color: transparent !important;
        }

        .main-image-bg {
          background-color: transparent !important;
        }

        .horizontal-space {
          display: none !important;
        }
      }
    </style>
    <!--[if (gte mso 9)|(IE)]>
  <style type="text/css">
    table {
      border-collapse: collapse !important;
    }
  </style>
<![endif]-->
    <!--[if (gte mso 9)|(IE)]>
<xml>
<o:OfficeDocumentSettings>
<o:AllowPNG />
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
<![endif]-->
  </head>

  <body style="margin: 0; padding: 0; background-color: #ffffff">
    <center>
      <table bgcolor="#ffffff"
        border="0"
        cellpadding="0"
        cellspacing="0"
        width="100%"
        style="border-spacing: 0; border-collapse: collapse; background-color: #ffffff; min-width: 100%">
        <tr>
          <td align="center"
            valign="top"
            style="margin-left: 0; margin-right: 0; margin-top: 0; margin-bottom: 0; padding-left: 0; padding-right: 0; padding-top: 0; padding-bottom: 0">
            <table class="main-bg"
              bgcolor="#232931"
              border="0"
              cellpadding="0"
              cellspacing="0"
              width="100%"
              style="border-spacing: 0; border-collapse: collapse; padding: 0; margin: 0; max-width: 1000px;background-color: #232931;">
              <tr>
                <td class="main-image-bg"
                  bgcolor="#ffffff"
                  style="margin: 0; padding: 0; background: url(); background-position: center bottom; background-repeat: repeat-y">
                  <table class="main-bg"
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                    style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%">
                    <!--[if mso | IE]>
                <tr>
                  <td align="center">
                    <table class="main-table" border="0"
                      cellspacing="0"
                      cellpadding="0"
                      width="600" style="width: 600px;max-width: 100%;">
                <![endif]-->
                    <tr>
                      <td align="center"
                        style="margin: 0; padding-left: 10px; padding-right: 10px;">
                        <table bgcolor="#ffffff"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          width="600"
                          style="border-spacing: 0; border-collapse: separate; padding: 0; margin: 0; max-width: 600px; width: 100%">
                        {{CONTENT}}
                        </table>
                      </td>
                    </tr>
                    <!--[if mso | IE]>
                    </table>
                  </td>
                </tr>
                <![endif]-->
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>`,Ke=e=>Ge.replace(`{{CONTENT}}`,e);function qe({children:e,width:t,onWidthChange:n,zoom:r}){let i=(0,B.useRef)(null),[a,o]=(0,B.useState)(!1),[s,c]=(0,B.useState)(typeof t==`number`?t:600);(0,B.useEffect)(()=>{typeof t==`number`&&c(t)},[t]);let l=(0,B.useCallback)(e=>{t!==`responsive`&&(e.preventDefault(),o(!0))},[t]),u=(0,B.useCallback)(e=>{if(!a||!i.current||t===`responsive`)return;let n=i.current.getBoundingClientRect(),o=n.left+n.width/2,s=Math.abs(e.clientX-o),l=Math.max(200,Math.min(2e3,s*2/r));c(Math.round(l))},[a,r,t]),d=(0,B.useCallback)(()=>{a&&t!==`responsive`&&(o(!1),n(s))},[a,s,n,t]);(0,B.useEffect)(()=>{if(a)return document.addEventListener(`mousemove`,u),document.addEventListener(`mouseup`,d),document.body.style.cursor=`ew-resize`,document.body.style.userSelect=`none`,()=>{document.removeEventListener(`mousemove`,u),document.removeEventListener(`mouseup`,d),document.body.style.cursor=``,document.body.style.userSelect=``}},[a,u,d]);let f=t===`responsive`,p=a?s:typeof t==`number`?t:600;return(0,X.jsxs)(`div`,{ref:i,className:`relative w-full`,children:[!f&&(0,X.jsx)(`div`,{className:`flex justify-center mb-2 relative`,children:(0,X.jsxs)(`div`,{className:`flex items-center justify-center text-primary font-mono text-[11px] font-semibold rounded-t border border-primary bg-primary/[0.08]`,style:{width:`${p*r}px`,height:20,transition:a?`none`:`width 0.3s ease`},children:[p,`px`]})}),(0,X.jsxs)(`div`,{className:`flex justify-center relative`,children:[!f&&(0,X.jsx)(`div`,{onMouseDown:l,className:`group absolute top-0 bottom-0 w-2 cursor-ew-resize ${a?`bg-primary`:`bg-transparent hover:bg-primary`}`,style:{left:`calc(50% - ${p*r/2}px - 4px)`,transition:a?`none`:`all 0.3s ease`},children:(0,X.jsx)(`span`,{className:`absolute top-1/2 -translate-y-1/2 rounded bg-white`,style:{left:3,width:2,height:30}})}),(0,X.jsx)(`div`,{style:{width:f?`100%`:`${p}px`,transition:a?`none`:`width 0.3s ease`},children:e}),!f&&(0,X.jsx)(`div`,{onMouseDown:l,className:`group absolute top-0 bottom-0 w-2 cursor-ew-resize ${a?`bg-primary`:`bg-transparent hover:bg-primary`}`,style:{right:`calc(50% - ${p*r/2}px - 4px)`,transition:a?`none`:`all 0.3s ease`},children:(0,X.jsx)(`span`,{className:`absolute top-1/2 -translate-y-1/2 rounded bg-white`,style:{right:3,width:2,height:30}})})]}),a&&(0,X.jsxs)(L.div,{initial:{opacity:0},animate:{opacity:1},className:`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-foreground px-4 py-2 rounded font-mono text-sm font-semibold pointer-events-none shadow-lg`,style:{backgroundColor:`hsl(var(--primary) / 0.95)`,zIndex:1e4},children:[s,`px`]})]})}var Q=[{name:`Mobile S`,width:320,height:568,icon:(0,X.jsx)(E,{size:16})},{name:`Mobile M`,width:375,height:667,icon:(0,X.jsx)(E,{size:16})},{name:`Mobile L`,width:425,height:812,icon:(0,X.jsx)(E,{size:16})},{name:`Tablet`,width:768,height:1024,icon:(0,X.jsx)(oe,{size:16})},{name:`Laptop`,width:1024,height:768,icon:(0,X.jsx)(h,{size:16})},{name:`Desktop`,width:1440,height:900,icon:(0,X.jsx)(h,{size:16})}];function Je({width:e,onWidthChange:t,orientation:n,onOrientationChange:r}){let[i,a]=B.useState(typeof e==`number`?e:375);return(0,X.jsxs)(`div`,{className:`flex items-center gap-4`,children:[(0,X.jsxs)(`select`,{value:(()=>{if(e===`responsive`)return`responsive`;let t=Q.find(t=>(n===`portrait`?t.width:t.height)===e);return t?t.name:`custom`})(),onChange:e=>{let r=e.target.value;if(r===`responsive`)t(`responsive`);else if(r===`custom`)t(i);else{let e=Q.find(e=>e.name===r);if(e){let r=n===`portrait`?e.width:e.height;a(r),t(r)}}},className:`h-8 min-w-[150px] rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20`,children:[(0,X.jsx)(`option`,{value:`responsive`,children:`Responsive`}),Q.map(e=>(0,X.jsxs)(`option`,{value:e.name,children:[e.name,` (`,n===`portrait`?e.width:e.height,`px)`]},e.name)),(0,X.jsx)(`option`,{value:`custom`,children:`Custom`})]}),e!==`responsive`&&(0,X.jsxs)(X.Fragment,{children:[(0,X.jsxs)(`div`,{className:`relative w-[100px]`,children:[(0,X.jsx)(`input`,{type:`number`,value:i,onChange:n=>{let r=parseInt(n.target.value)||375;a(r),e!==`responsive`&&t(r)},className:`h-8 w-full rounded-lg border border-input bg-background pl-2 pr-7 text-xs text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20`}),(0,X.jsx)(`span`,{className:`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground`,children:`px`})]}),(0,X.jsx)(`button`,{onClick:()=>{let i=n===`portrait`?`landscape`:`portrait`;if(r(i),typeof e==`number`){let r=Q.find(t=>(n===`portrait`?t.width:t.height)===e);if(r){let e=i===`portrait`?r.width:r.height;a(e),t(e)}}},title:`Rotate viewport`,className:`flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors`,children:(0,X.jsx)(C,{size:16})}),(0,X.jsx)(`span`,{className:`min-w-[60px] text-xs text-muted-foreground`,children:n===`portrait`?`Portrait`:`Landscape`})]}),e!==`responsive`&&(0,X.jsxs)(`span`,{className:`text-xs font-semibold text-primary`,children:[i,` × auto`]})]})}var Ye={primary:`border-primary/30 bg-primary/10 text-primary`,secondary:`border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-300`,warning:`border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300`,default:`border-border bg-muted/40 text-muted-foreground`};function Xe({block:e,onDelete:t,onUpdate:n,isFileBlock:r=!1}){let i=(0,B.useMemo)(()=>Ke(e.html),[e.html]),o=(()=>{switch(e.source){case`src`:return{label:`src/blocks`,color:`secondary`,tooltip:e.filePath||`Source code blocks - requires rebuild`};case`data`:if(e.filePath){let t=e.filePath.substring(0,e.filePath.lastIndexOf(`/`)),n=t;for(let e of[`server/data/blocks/`,`data/blocks/`,`blocks/`]){let r=t.indexOf(e);if(r!==-1){n=t.substring(r);break}}let r=n.split(`/`);return r.length>3&&(n=`.../`+r.slice(-3).join(`/`)),{label:n,color:`primary`,tooltip:`Full path: ${t}`}}return{label:`data/blocks/files`,color:`primary`,tooltip:`Data blocks - immediately visible`};case`localStorage`:return{label:`Browser Storage`,color:`warning`,tooltip:`Stored in browser localStorage`};default:return{label:`Unknown`,color:`default`,tooltip:`Unknown source location`}}})(),[p,m]=(0,B.useState)(!1),[h,g]=(0,B.useState)(!1),[_,v]=(0,B.useState)(!1),[y,b]=(0,B.useState)(e.html),[x,S]=(0,B.useState)(`responsive`),[C,w]=(0,B.useState)(`portrait`),[T,E]=(0,B.useState)(null),[O,j]=(0,B.useState)(!1),[M,N]=(0,B.useState)(!1),[P,I]=(0,B.useState)(1);(0,B.useEffect)(()=>{if(!h)return;let e=e=>{e.key===`+`||e.key===`=`?(e.preventDefault(),I(e=>Math.min(3,e+.1))):e.key===`-`||e.key===`_`?(e.preventDefault(),I(e=>Math.max(.25,e-.1))):(e.key===`r`||e.key===`R`||e.key===`0`)&&(e.preventDefault(),I(1))},t=e=>{(e.ctrlKey||e.metaKey)&&(e.preventDefault(),e.deltaY<0?I(e=>Math.min(3,e+.1)):I(e=>Math.max(.25,e-.1)))};return window.addEventListener(`keydown`,e),window.addEventListener(`wheel`,t,{passive:!1}),()=>{window.removeEventListener(`keydown`,e),window.removeEventListener(`wheel`,t)}},[h]);let L=async()=>{try{await navigator.clipboard.writeText(e.html),z.success(`Code copied to clipboard!`)}catch(e){let t=e instanceof Error?e.message:`Unknown error`;a.error(`BlockItem`,`Failed to copy block HTML`,e),z.error(`Copy failed: ${t}. Check clipboard permissions.`)}};return(0,X.jsxs)(X.Fragment,{children:[(0,X.jsxs)(`div`,{className:`h-full flex flex-col bg-card rounded-2xl border border-border/50 shadow-soft hover:shadow-lg hover:border-border transition-all duration-300 group overflow-hidden`,children:[(0,X.jsxs)(`div`,{className:`relative flex items-center justify-center overflow-hidden border-b border-border/50 cursor-pointer bg-muted/30`,style:{height:Y.PREVIEW_HEIGHT},onClick:()=>g(!0),children:[e.preview?(0,X.jsx)(`img`,{src:e.preview,alt:e.name,style:{maxWidth:`100%`,maxHeight:`100%`,objectFit:`contain`}}):(0,X.jsx)(`div`,{className:`w-full h-full flex items-center justify-center text-xs text-muted-foreground p-4`,dangerouslySetInnerHTML:{__html:i}}),(0,X.jsxs)(`div`,{className:`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 bg-black/70 rounded-lg p-1 backdrop-blur-sm`,onClick:e=>e.stopPropagation(),children:[(0,X.jsx)(`button`,{onClick:L,className:`p-1.5 text-white hover:bg-white/20 rounded-md transition-colors`,title:`Quick copy`,children:(0,X.jsx)(l,{size:14})}),(0,X.jsx)(`button`,{onClick:()=>g(!0),className:`p-1.5 text-white hover:bg-white/20 rounded-md transition-colors`,title:`Full preview`,children:(0,X.jsx)(R,{size:14})})]})]}),(0,X.jsxs)(`div`,{className:`flex-grow p-4`,children:[(0,X.jsxs)(`div`,{className:`flex justify-between items-start mb-2 gap-2`,children:[(0,X.jsx)(`h3`,{className:`text-base font-bold text-foreground leading-tight`,children:e.name}),(e.isCustom||r)&&(0,X.jsx)(`span`,{className:`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary`,children:r?`File`:`Custom`})]}),(0,X.jsxs)(`div`,{className:`flex flex-wrap items-center gap-1.5 mb-2`,children:[(0,X.jsxs)(`span`,{className:`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground border border-border/50`,children:[We(e.category),e.category]}),(0,X.jsxs)(`span`,{title:o.tooltip,className:A(`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border`,Ye[o.color]),children:[(0,X.jsx)(d,{size:12}),o.label]})]}),(0,X.jsxs)(`p`,{className:`text-xs text-muted-foreground`,children:[e.keywords.slice(0,Y.MAX_KEYWORDS_DISPLAY).join(`, `),e.keywords.length>Y.MAX_KEYWORDS_DISPLAY&&`...`]})]}),(0,X.jsxs)(`div`,{className:`flex items-center justify-between px-4 pb-4`,children:[(0,X.jsxs)(`div`,{className:`flex items-center gap-1`,children:[(0,X.jsx)(`button`,{onClick:()=>{b(e.html),v(!1),m(!0)},title:`View code`,className:`p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors`,children:(0,X.jsx)(s,{size:16})}),(0,X.jsx)(`button`,{onClick:()=>g(!0),title:`Preview`,className:`p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors`,children:(0,X.jsx)(R,{size:16})})]}),(0,X.jsxs)(`div`,{className:`flex items-center gap-1`,children:[(0,X.jsxs)(`button`,{onClick:L,className:`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors`,children:[(0,X.jsx)(l,{size:14}),` Copy`]}),t&&(0,X.jsx)(`button`,{onClick:()=>{N(!0)},disabled:O,title:`Delete`,className:`p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50`,children:(0,X.jsx)(D,{size:16})})]})]})]}),(0,X.jsxs)(k,{open:p,onClose:()=>m(!1),maxWidthClass:`max-w-2xl`,title:`HTML Code - ${e.name}`,headerExtra:(e.isCustom||r)&&!_?(0,X.jsxs)(`button`,{onClick:()=>{v(!0)},className:`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-muted transition-colors`,children:[(0,X.jsx)(F,{size:14}),` Edit`]}):void 0,actionsRow:_?(0,X.jsxs)(X.Fragment,{children:[(0,X.jsx)(`button`,{onClick:()=>{b(e.html),v(!1)},className:`px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all`,children:`Cancel`}),(0,X.jsx)(`button`,{onClick:async()=>{if(!y.trim()){E(`HTML code cannot be empty`);return}try{if(r){let t=await V.updateBlock(e.id,{html:y.trim()});t&&n&&(n({...e,html:t.html}),z.success(`Block updated successfully!`),v(!1),m(!1))}else{let t=je(e.id,{html:y.trim()});t&&n?(n(t),z.success(`Block updated successfully!`),v(!1),m(!1)):E(`Failed to update block`)}}catch(e){let t=e instanceof Error?e.message:`Unknown error`;a.error(`BlockItem`,`Failed to save block`,e),t.includes(`network`)||t.includes(`fetch`)?E(`Network error. Check your connection.`):E(r?`File update failed: ${t}`:`Save failed: ${t}`)}},disabled:!y.trim(),className:`px-5 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm disabled:opacity-50`,children:`Save Changes`})]}):(0,X.jsxs)(X.Fragment,{children:[(0,X.jsxs)(`button`,{onClick:L,className:`px-5 py-2.5 flex items-center gap-2 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all`,children:[(0,X.jsx)(l,{size:16}),` Copy to Clipboard`]}),(0,X.jsx)(`button`,{onClick:()=>m(!1),className:`px-5 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm`,children:`Close`})]}),children:[T&&(0,X.jsx)(`div`,{className:`mb-4 rounded-xl border border-red-200 bg-red-50 text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-200 px-3.5 py-2.5 text-xs leading-relaxed`,children:T}),(0,X.jsx)(`textarea`,{rows:15,readOnly:!_,value:_?y:e.html,onChange:_?e=>b(e.target.value):void 0,placeholder:_?`Enter your email-safe HTML code here...`:void 0,className:A(`w-full font-mono text-sm rounded-xl border border-input p-3 text-foreground outline-none resize-y`,_?`bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20`:`bg-muted/30 cursor-default`)})]}),(0,X.jsx)(k,{open:h,onClose:()=>{g(!1),I(1)},maxWidthClass:`max-w-5xl`,title:`${e.name} - Preview`,actionsRow:(0,X.jsxs)(`div`,{className:`flex items-center justify-between w-full gap-3`,children:[(0,X.jsxs)(`p`,{className:`text-xs text-muted-foreground`,children:[`💡 Tip: Use `,(0,X.jsx)(`strong`,{className:`text-foreground`,children:`+/-`}),` keys,`,` `,(0,X.jsx)(`strong`,{className:`text-foreground`,children:`R`}),` to reset, or`,` `,(0,X.jsx)(`strong`,{className:`text-foreground`,children:`Ctrl+Scroll`}),` to zoom`]}),(0,X.jsx)(`button`,{onClick:()=>g(!1),className:`px-5 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm shrink-0`,children:`Close`})]}),children:(0,X.jsxs)(`div`,{className:`flex flex-col gap-3`,children:[(0,X.jsxs)(`div`,{className:`flex items-center justify-between flex-wrap gap-3`,children:[(0,X.jsxs)(`div`,{className:`flex items-center rounded-lg border border-border overflow-hidden`,children:[(0,X.jsx)(`button`,{onClick:()=>I(e=>Math.max(.25,e-.1)),disabled:P<=.25,title:`Zoom out (-)`,className:`p-2 text-foreground hover:bg-muted transition-colors disabled:opacity-40`,children:(0,X.jsx)(c,{size:14})}),(0,X.jsx)(`button`,{onClick:()=>I(1),disabled:P===1,title:`Reset zoom (R)`,className:`p-2 text-foreground hover:bg-muted transition-colors disabled:opacity-40 border-x border-border`,children:(0,X.jsx)(f,{size:14})}),(0,X.jsxs)(`span`,{className:`px-3 text-xs font-semibold min-w-[56px] text-center`,children:[Math.round(P*100),`%`]}),(0,X.jsx)(`button`,{onClick:()=>I(e=>Math.min(3,e+.1)),disabled:P>=3,title:`Zoom in (+)`,className:`p-2 text-foreground hover:bg-muted transition-colors disabled:opacity-40 border-l border-border`,children:(0,X.jsx)(u,{size:14})})]}),(0,X.jsx)(Je,{width:x,onWidthChange:S,orientation:C,onOrientationChange:w})]}),(0,X.jsx)(`div`,{className:`overflow-auto rounded-xl p-4`,style:{maxHeight:`70vh`,backgroundColor:`#f5f5f5`},children:(0,X.jsx)(qe,{width:x,onWidthChange:S,zoom:P,children:(0,X.jsx)(`div`,{style:{transform:`scale(${P})`,transformOrigin:`top center`,transition:`transform 0.3s ease`,backgroundColor:`#fff`,minHeight:200},className:`border border-border rounded-lg p-4 shadow-md`,dangerouslySetInnerHTML:{__html:i}})})})]})}),(0,X.jsxs)(k,{open:M,onClose:()=>N(!1),maxWidthClass:`max-w-xs`,title:`Delete Block?`,actionsRow:(0,X.jsxs)(X.Fragment,{children:[(0,X.jsx)(`button`,{onClick:()=>N(!1),className:`px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all`,children:`Cancel`}),(0,X.jsx)(`button`,{onClick:async()=>{if(t)try{j(!0),N(!1),t(e.id),z.success(`"${e.name}" deleted successfully`)}catch(e){let t=e instanceof Error?e.message:`Unknown error`;a.error(`BlockItem`,`Failed to delete block`,e),z.error(`Delete failed: ${t}`)}finally{j(!1)}},disabled:O,className:`px-5 py-2.5 text-sm font-bold bg-destructive hover:brightness-110 text-destructive-foreground rounded-xl transition-all shadow-sm disabled:opacity-50`,children:`Delete`})]}),children:[(0,X.jsxs)(`p`,{className:`text-foreground`,children:[`Are you sure you want to delete `,(0,X.jsxs)(`strong`,{children:[`"`,e.name,`"`]}),`?`]}),(0,X.jsx)(`p`,{className:`text-sm text-muted-foreground mt-1`,children:r?`This will permanently delete the .ts file from your project.`:`This action cannot be undone.`})]})]})}var Ze=B.memo(Xe,(e,t)=>e.block.id===t.block.id&&e.block.name===t.block.name&&e.block.html===t.block.html&&e.isFileBlock===t.isFileBlock),$=16,Qe=Y.PREVIEW_HEIGHT+180,$e=Qe+$;function et(e){let[t,n]=(0,B.useState)(()=>typeof window<`u`?window.matchMedia(e).matches:!1);return(0,B.useEffect)(()=>{if(typeof window>`u`)return;let t=window.matchMedia(e),r=()=>n(t.matches);return r(),t.addEventListener(`change`,r),()=>t.removeEventListener(`change`,r)},[e]),t}function tt({index:e,style:t,blocks:n,columns:r,fileBlockIds:i,onDelete:a,onUpdate:o}){let s=e*r,c=n.slice(s,s+r);return(0,X.jsx)(`div`,{style:{...t,height:Qe,paddingLeft:16,paddingRight:16,boxSizing:`border-box`,display:`grid`,gridTemplateColumns:`repeat(${r}, 1fr)`,gap:`${$}px`},children:c.map(e=>(0,X.jsx)(Ze,{block:e,onDelete:a,onUpdate:o,isFileBlock:i.has(e.id)},`${e.source||`unknown`}-${e.id}`))})}function nt({blocks:e,fileBlocks:t,onDelete:n,onUpdate:r}){let i=et(`(max-width: 599.98px)`),a=et(`(min-width: 600px) and (max-width: 899.98px)`),o=i?1:a?2:3,s=Math.ceil(e.length/o),c=(0,B.useMemo)(()=>new Set(t.map(e=>e.id)),[t]),l=(0,B.useMemo)(()=>({blocks:e,columns:o,fileBlockIds:c,onDelete:n,onUpdate:r}),[e,o,c,n,r]),[u,d]=w();return e.length===0?null:(0,X.jsx)(`div`,{ref:u,className:`w-full h-full`,style:{paddingTop:`${$}px`},children:d.width>0&&d.height>0&&(0,X.jsx)(b,{rowComponent:tt,rowCount:s,rowHeight:$e,rowProps:l,overscanCount:2,style:{height:d.height-$,width:d.width}})})}var rt=`h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer`;function it(){let[e,t]=(0,B.useState)([]),[n,r]=(0,B.useState)([]),[i,o]=(0,B.useState)([]),[s,c]=(0,B.useState)(``),[l,d]=(0,B.useState)(`All`),[f,p]=(0,B.useState)(`all`),[m,h]=(0,B.useState)(!0),[_,b]=(0,B.useState)(!1),[S,C]=(0,B.useState)(null),[w,E]=(0,B.useState)(!1),[D,O]=(0,B.useState)(!1),k=y(s,ze.DEBOUNCE_SEARCH),A=e=>e.includes(`/src/blocks`)?`src`:`data`,j=(0,B.useCallback)(async()=>{try{return(await V.listBlocks()).filter(e=>e.filePath).map(e=>({id:e.id,name:e.name,category:e.category,keywords:e.keywords,html:e.html,preview:e.preview,createdAt:e.createdAt||Date.now(),isCustom:!0,source:A(e.filePath),filePath:e.filePath}))}catch(e){return a.warn(`BlockLibrary`,`File API unavailable`,e),[]}},[]);(0,B.useEffect)(()=>{(async()=>{try{h(!0),C(null);let e=q(!1),[n,i,s]=await Promise.all([ke(),Promise.resolve(W()),j()]);if(t(n),o(i.map(e=>({...e,source:`localStorage`}))),e.length===0)r([]);else{let t=new Set(e.map(e=>e.path)),n=s.filter(e=>e.filePath?Array.from(t).some(t=>e.filePath.includes(t)):!1);r(n)}ce([...n,...i.map(e=>({...e,source:`localStorage`})),...s]).catch(e=>{a.warn(`BlockLibrary`,`Failed to preload block images`,e)})}catch(e){let t=e instanceof Error?e.message:`Unknown error`;a.error(`BlockLibrary`,`Failed to load blocks`,e),C(`Failed to load blocks: ${t}`)}finally{h(!1)}})()},[j,D]);let M=(0,B.useMemo)(()=>{switch(f){case`src`:return e;case`data`:return n;case`localStorage`:return i;default:return[...e,...n,...i]}},[f,e,n,i]),N=(0,B.useMemo)(()=>Ne(M,k,l===`All`?void 0:l),[M,k,l]),F=(0,B.useMemo)(()=>Pe(M),[M]),I=(0,B.useCallback)(async s=>{if(!_){b(!0);try{if(n.find(e=>e.id===s)){try{await V.deleteBlock(s);let e=await j(),t=q(!1);if(t.length===0)r(e);else{let n=new Set(t.map(e=>e.path)),i=e.filter(e=>e.filePath?Array.from(n).some(t=>e.filePath.includes(t)):!1);r(i)}}catch(e){a.error(`BlockLibrary`,`Failed to delete file block`,e),C(U(e))}return}if(i.find(e=>e.id===s)){Me(s),o(W().map(e=>({...e,source:`localStorage`})));return}t(e.filter(e=>e.id!==s))}finally{b(!1)}}},[_,n,i,e,j]),L=(0,B.useCallback)(async e=>{if(!_){b(!0);try{if(n.find(t=>t.id===e.id)){try{await V.updateBlock(e.id,{name:e.name,category:e.category,keywords:e.keywords,html:e.html,preview:e.preview});let t=await j(),n=q(!1);if(n.length===0)r(t);else{let e=new Set(n.map(e=>e.path)),i=t.filter(t=>t.filePath?Array.from(e).some(e=>t.filePath.includes(e)):!1);r(i)}}catch(e){a.error(`BlockLibrary`,`Failed to update file block`,e),C(U(e))}return}if(i.find(t=>t.id===e.id)){let t=i.map(t=>t.id===e.id?{...e,source:`localStorage`}:t);try{G(t),o(t)}catch(e){a.error(`BlockLibrary`,`Failed to save custom block`,e),C(U(e))}return}let t={...e,isCustom:!0,source:`localStorage`},s=[...i,t];try{G(s),o(s)}catch(e){a.error(`BlockLibrary`,`Failed to save custom block`,e),C(U(e))}}finally{b(!1)}}},[_,n,i,j]),R=(0,B.useCallback)(async()=>{E(!1);let e=q(!1),[t,n]=await Promise.all([j(),Promise.resolve(W())]);if(e.length===0)r(t);else{let n=new Set(e.map(e=>e.path)),i=t.filter(e=>e.filePath?Array.from(n).some(t=>e.filePath.includes(t)):!1);r(i)}o(n.map(e=>({...e,source:`localStorage`})))},[j]);return m?(0,X.jsxs)(`div`,{className:`p-6`,children:[(0,X.jsx)(`h1`,{className:`text-2xl font-bold text-foreground mb-6`,children:`Block Library`}),(0,X.jsx)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4`,children:[...Array(Y.SKELETON_COUNT)].map((e,t)=>(0,X.jsxs)(`div`,{className:`bg-card border border-border/50 rounded-2xl shadow-soft p-4`,children:[(0,X.jsx)(`div`,{className:`animate-pulse bg-muted rounded-xl`,style:{height:200}}),(0,X.jsx)(`div`,{className:`animate-pulse bg-muted rounded-md h-4 mt-3 w-full`}),(0,X.jsx)(`div`,{className:`animate-pulse bg-muted rounded-md h-4 mt-2 w-3/5`})]},t))})]}):S?(0,X.jsx)(`div`,{className:`p-6`,children:(0,X.jsx)(g,{tone:`error`,children:S})}):(0,X.jsxs)(`div`,{"data-app-scroll":`true`,className:`flex flex-col h-full`,style:{overflow:N.length===0?`auto`:`hidden`},children:[(0,X.jsxs)(`div`,{className:`px-6 pt-6`,children:[(0,X.jsxs)(`div`,{className:`flex items-center justify-between mb-6 flex-wrap gap-3`,children:[(0,X.jsxs)(`div`,{children:[(0,X.jsx)(`h1`,{className:`text-2xl font-bold text-foreground`,children:`Block Library`}),(0,X.jsxs)(`p`,{className:`text-xs text-muted-foreground mt-0.5`,children:[`📁 `,e.length+n.length+i.length,` blocks in library`]})]}),(0,X.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,X.jsxs)(`button`,{onClick:async()=>{h(!0);try{let[e,n,i]=await Promise.all([Promise.resolve(ke()),j(),Promise.resolve(W())]);t(e);let a=q(!1);if(a.length===0)r(n);else{let e=new Set(a.map(e=>e.path)),t=n.filter(t=>t.filePath?Array.from(e).some(e=>t.filePath.includes(e)):!1);r(t)}o(i.map(e=>({...e,source:`localStorage`}))),C(null)}catch(e){C(U(e))}finally{h(!1)}},disabled:m||_,className:`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border border-input text-foreground hover:bg-muted rounded-xl transition-all disabled:opacity-50`,children:[(0,X.jsx)(v,{size:16}),` Refresh`]}),(0,X.jsxs)(`button`,{onClick:()=>O(!0),className:`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border border-input text-foreground hover:bg-muted rounded-xl transition-all`,children:[(0,X.jsx)(P,{size:16}),` Storage`]}),(0,X.jsxs)(`button`,{onClick:()=>E(!0),className:`flex items-center gap-1.5 px-3 py-2 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm`,children:[(0,X.jsx)(u,{size:16}),` Add Block`]})]})]}),(0,X.jsx)(`div`,{className:`bg-card border border-border/50 rounded-2xl shadow-soft p-4 mb-6`,children:(0,X.jsxs)(`div`,{className:`grid grid-cols-1 md:grid-cols-12 gap-3 items-center`,children:[(0,X.jsxs)(`div`,{className:`md:col-span-4 relative`,children:[(0,X.jsx)(T,{size:16,className:`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none`}),(0,X.jsx)(`input`,{type:`text`,placeholder:`Search blocks...`,value:s,onChange:e=>c(e.target.value),className:`h-11 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20`})]}),(0,X.jsx)(`div`,{className:`md:col-span-3`,children:(0,X.jsxs)(`select`,{value:f,onChange:e=>p(e.target.value),className:rt,children:[(0,X.jsxs)(`option`,{value:`all`,children:[`🌐 All Sources (`,e.length+n.length+i.length,`)`]}),(0,X.jsxs)(`option`,{value:`src`,children:[`📁 src/blocks/ (`,e.length,`)`]}),(0,X.jsxs)(`option`,{value:`data`,children:[`💾 data/blocks/files/ (`,n.length,`)`]}),(0,X.jsxs)(`option`,{value:`localStorage`,children:[`🔒 localStorage (`,i.length,`)`]})]})}),(0,X.jsx)(`div`,{className:`md:col-span-3`,children:(0,X.jsxs)(`select`,{value:l,onChange:e=>d(e.target.value),className:rt,children:[(0,X.jsx)(`option`,{value:`All`,children:`All Categories`}),F.map(e=>(0,X.jsx)(`option`,{value:e,children:e},e))]})}),(0,X.jsx)(`div`,{className:`md:col-span-2`,children:(0,X.jsxs)(`p`,{className:`text-sm text-muted-foreground text-center`,children:[N.length,` `,N.length===1?`block`:`blocks`]})})]})})]}),N.length===0?(0,X.jsxs)(`div`,{className:`flex flex-col items-center justify-center text-center p-6`,style:{minHeight:400},children:[q(!1).length===0&&!s&&l===`All`?(0,X.jsxs)(X.Fragment,{children:[(0,X.jsx)(`div`,{className:`mb-6 max-w-[600px]`,children:(0,X.jsxs)(g,{tone:`info`,children:[(0,X.jsx)(`p`,{className:`font-bold mb-1`,children:`No visible storage locations configured!`}),(0,X.jsxs)(`p`,{children:[`Please click the `,(0,X.jsx)(`strong`,{children:`Storage`}),` button above to add locations where your blocks will be stored. For example:`,` `,(0,X.jsx)(`code`,{className:`bg-muted px-1 py-0.5 rounded`,children:`/Users/your-name/Documents/blocks`})]})]})}),(0,X.jsx)(`div`,{className:`w-[120px] h-[120px] rounded-full bg-muted flex items-center justify-center mb-4`,children:(0,X.jsx)(P,{size:60,className:`text-muted-foreground/50`})})]}):(0,X.jsxs)(X.Fragment,{children:[(0,X.jsx)(`div`,{className:`w-[120px] h-[120px] rounded-full bg-muted flex items-center justify-center mb-4`,children:s||l!==`All`?(0,X.jsx)(x,{size:60,className:`text-muted-foreground/50`}):(0,X.jsx)(u,{size:60,className:`text-muted-foreground/50`})}),(0,X.jsx)(`h2`,{className:`text-xl font-bold text-foreground mb-2`,children:s||l!==`All`?`No blocks found`:`Your block library is empty`})]}),(0,X.jsx)(`p`,{className:`text-sm text-muted-foreground mb-6 max-w-[400px]`,children:s||l!==`All`?`Try different keywords or clear filters to see more blocks.`:`Start building your email templates by creating your first custom block.`}),s||l!==`All`?(0,X.jsx)(`button`,{onClick:()=>{c(``),d(`All`)},className:`px-5 py-2.5 text-sm font-bold border border-input text-foreground hover:bg-muted rounded-xl transition-all`,children:`Clear Filters`}):(0,X.jsxs)(`button`,{onClick:()=>E(!0),className:`flex items-center gap-2 px-5 py-3 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm`,children:[(0,X.jsx)(u,{size:18}),` Create First Block`]})]}):(0,X.jsx)(`div`,{className:`flex-1 px-6 pb-6`,style:{minHeight:400},children:(0,X.jsx)(nt,{blocks:N,fileBlocks:n,onDelete:I,onUpdate:L})}),(0,X.jsx)(Ve,{open:w,onClose:()=>E(!1),onBlockAdded:R}),(0,X.jsx)(He,{open:D,onClose:()=>O(!1)})]})}export{it as default};